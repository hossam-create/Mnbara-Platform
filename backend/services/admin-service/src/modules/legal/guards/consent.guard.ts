import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { LegalService } from '../legal.service';

@Injectable()
export class ConsentGuard implements CanActivate {
  constructor(private readonly legalService: LegalService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || null;
    
    // Define required documents based on route
    const requiredDocuments = this.getRequiredDocumentsForRoute(request);
    
    if (requiredDocuments.length === 0) {
      return true;
    }

    const enforcementResult = await this.legalService.enforceConsentRequirements(
      userId,
      requiredDocuments
    );

    if (!enforcementResult.hasAllConsents) {
      throw new ForbiddenException({
        message: 'Consent required',
        code: 'CONSENT_REQUIRED',
        missingConsents: enforcementResult.missingConsents,
        details: enforcementResult.details
      });
    }

    return true;
  }

  private getRequiredDocumentsForRoute(request: any): string[] {
    const route = request.route?.path || '';
    const method = request.method;

    // Traveler actions require traveler agreement
    if (route.includes('/traveler/') && method === 'POST') {
      return ['traveler-agreement'];
    }

    // Buyer actions require user agreement
    if ((route.includes('/buyer/') || route.includes('/request/')) && method === 'POST') {
      return ['user-agreement'];
    }

    // Dispute actions require dispute resolution agreement
    if (route.includes('/dispute/') && method === 'POST') {
      return ['dispute-resolution'];
    }

    return [];
  }
}