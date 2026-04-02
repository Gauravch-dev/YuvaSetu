import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User';
import { sendError } from '../utils/response';

export const requireRole = (role: UserRole) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return sendError(res, 401, 'Unauthorized: No user found', 'AUTH_REQUIRED');
        }

        if (req.user.role !== role) {
            return sendError(res, 403, 'Forbidden: Insufficient permissions', 'RBAC_DENIED');
        }

        next();
    };
};
