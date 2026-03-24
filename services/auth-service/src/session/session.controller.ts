import { 
  Controller, 
  Get, 
  Delete, 
  Param, 
  UseGuards,
  Req,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { SessionService } from '../services/session.service';

@ApiTags('sessions')
@Controller('sessions')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class SessionController {
  private readonly logger = new Logger(SessionController.name);

  constructor(private readonly sessionService: SessionService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get all sessions for current user' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  async getMySessions(@Req() req: Request) {
    const user = req.user as any;
    const sessions = await this.sessionService.getUserSessions(user.id);

    return {
      success: true,
      data: { sessions },
    };
  }

  @Delete('current')
  @ApiOperation({ summary: 'Delete current session' })
  @ApiResponse({ status: 200, description: 'Session deleted successfully' })
  async deleteCurrentSession(@Req() req: Request) {
    const user = req.user as any;
    const sessionId = req.headers['x-session-id'] as string;

    if (sessionId) {
      await this.sessionService.deleteSession(sessionId);
    }

    return {
      success: true,
      message: 'Session deleted successfully',
    };
  }

  @Delete(':sessionId')
  @ApiOperation({ summary: 'Delete specific session' })
  @ApiResponse({ status: 200, description: 'Session deleted successfully' })
  async deleteSession(@Param('sessionId') sessionId: string, @Req() req: Request) {
    const user = req.user as any;
    
    // Verify session belongs to user
    const session = await this.sessionService.getSession(sessionId);
    if (session && session.userId === user.id) {
      await this.sessionService.deleteSession(sessionId);
    }

    return {
      success: true,
      message: 'Session deleted successfully',
    };
  }
}
