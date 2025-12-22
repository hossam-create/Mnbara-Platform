import { UserRole } from '../../shared/middleware';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                email: string;
                role: UserRole;
            };
        }
    }
}

export {};