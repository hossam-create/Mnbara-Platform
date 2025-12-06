import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../../database/database.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { MfaService } from './mfa/mfa.service';
import { SearchService } from '../search/search.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private db: DatabaseService,
    private jwtService: JwtService,
    private mfaService: MfaService,
    private searchService: SearchService,
    @InjectQueue('search-queue') private searchQueue: Queue,
  ) {}

  async register(registerDto: RegisterDto, createdBy: number) {
    // Check if user already exists
    const existingUser = await this.db.findOne('users', { email: registerDto.email });
    if (existingUser) {
      throw new UnauthorizedException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    // Create user
    const user = await this.db.insert('users', {
      email: registerDto.email,
      password: hashedPassword,
      first_name: registerDto.firstName,
      last_name: registerDto.lastName,
      phone: registerDto.phone,
      role: 'viewer', // Default role
      created_at: new Date(),
    });

    // Assign default viewer role
    const viewerRole = await this.db.findOne('roles', { name: 'viewer' });
    if (viewerRole) {
      await this.db.insert('user_roles', {
        user_id: user.id,
        role_id: viewerRole.id,
        assigned_by: createdBy,
      });
    }

    // Log audit
    await this.logAudit(createdBy, 'USER_CREATED', 'users', user.id, {
      email: user.email,
    });

    // Add indexing job to queue (Async)
    await this.searchQueue.add('index-user', {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: 'viewer',
      created_at: user.created_at,
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
    };
  }

  async login(loginDto: LoginDto, ipAddress: string, userAgent: string) {
    const { email, password, mfaCode } = loginDto;

    // Find user
    const user = await this.db.findOne('users', { email });
    if (!user) {
      await this.logFailedAttempt(email, ipAddress, userAgent);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.account_locked) {
      throw new UnauthorizedException(
        `Account is locked. Reason: ${user.lock_reason || 'Security'}`,
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await this.incrementFailedAttempts(user.id, email, ipAddress, userAgent);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check MFA if enabled
    const mfaSettings = await this.db.findOne('user_mfa', { user_id: user.id });
    if (mfaSettings && mfaSettings.enabled) {
      if (!mfaCode) {
        return { requiresMfa: true };
      }
      
      const isMfaValid = await this.mfaService.validateToken(user.id, mfaCode);
      if (!isMfaValid) {
        await this.incrementFailedAttempts(user.id, email, ipAddress, userAgent);
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    // Reset failed login count
    await this.db.update('users', { id: user.id }, { failed_login_count: 0 });

    // Get user roles and permissions
    const roles = await this.getUserRoles(user.id);
    const permissions = await this.getUserPermissions(user.id);

    // Generate tokens
    const accessToken = await this.generateAccessToken(user, roles, permissions);
    const refreshToken = await this.generateRefreshToken(user.id);

    // Log audit
    await this.logAudit(user.id, 'USER_LOGIN', null, null, {
      ip: ipAddress,
      userAgent,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roles,
        permissions,
      },
    };
  }

  async logout(userId: number, refreshToken: string) {
    // Revoke refresh token
    await this.db.update(
      'refresh_tokens',
      { token: refreshToken, user_id: userId },
      { revoked: true, revoked_at: new Date() },
    );

    // Log audit
    await this.logAudit(userId, 'USER_LOGOUT', null, null, {});

    return { message: 'Logged out successfully' };
  }

  async refreshAccessToken(refreshToken: string) {
    // Find refresh token
    const tokenRecord = await this.db.findOne('refresh_tokens', {
      token: refreshToken,
      revoked: false,
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check expiration
    if (new Date(tokenRecord.expires_at) < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Get user
    const user = await this.db.findOne('users', { id: tokenRecord.user_id });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Get roles and permissions
    const roles = await this.getUserRoles(user.id);
    const permissions = await this.getUserPermissions(user.id);

    // Generate new access token
    const accessToken = await this.generateAccessToken(user, roles, permissions);

    return { accessToken };
  }

  private async generateAccessToken(user: any, roles: string[], permissions: string[]) {
    const payload = {
      sub: user.id,
      email: user.email,
      roles,
      permissions,
    };

    return this.jwtService.sign(payload, { expiresIn: '15m' });
  }

  private async generateRefreshToken(userId: number) {
    const token = this.jwtService.sign({ sub: userId }, { expiresIn: '7d' });

    // Store in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.db.insert('refresh_tokens', {
      user_id: userId,
      token,
      expires_at: expiresAt,
    });

    return token;
  }

  private async getUserRoles(userId: number): Promise<string[]> {
    const result = await this.db.query(
      `SELECT r.name 
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1
         AND (ur.expires_at IS NULL OR ur.expires_at > NOW())`,
      [userId],
    );

    return result.rows.map((row) => row.name);
  }

  private async getUserPermissions(userId: number): Promise<string[]> {
    const result = await this.db.query(
      `SELECT DISTINCT p.name
       FROM user_roles ur
       JOIN role_permissions rp ON ur.role_id = rp.role_id
       JOIN permissions p ON rp.permission_id = p.id
       WHERE ur.user_id = $1
         AND (ur.expires_at IS NULL OR ur.expires_at > NOW())`,
      [userId],
    );

    return result.rows.map((row) => row.name);
  }

  private async incrementFailedAttempts(
    userId: number,
    email: string,
    ipAddress: string,
    userAgent: string,
  ) {
    await this.logFailedAttempt(email, ipAddress, userAgent);

    const result = await this.db.query(
      'UPDATE users SET failed_login_count = failed_login_count + 1 WHERE id = $1 RETURNING failed_login_count',
      [userId],
    );

    const failedCount = result.rows[0]?.failed_login_count || 0;

    // Lock account after 5 failed attempts
    if (failedCount >= 5) {
      await this.db.update(
        'users',
        { id: userId },
        {
          account_locked: true,
          lock_reason: 'Too many failed login attempts',
          locked_at: new Date(),
        },
      );
    }
  }

  private async logFailedAttempt(email: string, ipAddress: string, userAgent: string) {
    await this.db.insert('failed_login_attempts', {
      email,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  private async logAudit(
    userId: number,
    action: string,
    resourceType: string | null,
    resourceId: number | null,
    metadata: any,
  ) {
    await this.db.insert('audit_logs', {
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata,
    });
  }
}
