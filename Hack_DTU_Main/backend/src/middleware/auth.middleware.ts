import { Request, Response, NextFunction } from 'express';
import { firebaseAuth } from '../config/firebase';
import User, { IUser } from '../models/User';
import { sendError } from '../utils/response';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return sendError(res, 401, 'Unauthorized: No token provided', 'AUTH_TOKEN_MISSING');
    }

    const token = authHeader.split(' ')[1];

    try {
        const decodedToken = await firebaseAuth.verifyIdToken(token);
        const firebaseUid = decodedToken.uid;

        const user = await User.findOne({ firebaseUid });

        if (!user) {
            return sendError(res, 401, 'Unauthorized: User profile not found', 'AUTH_USER_NOT_FOUND');
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth Error:', error);
        return sendError(res, 401, 'Unauthorized: Invalid token', 'AUTH_TOKEN_INVALID');
    }
};
