import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.middleware';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    return new Promise<boolean>((resolve) => {
      // Create a mock next function that resolves the promise
      const next = (error?: any) => {
        if (error) {
          resolve(false);
        } else {
          resolve(true);
        }
      };

      // Call the Express middleware
      authenticate(request, response, next);
    });
  }
}