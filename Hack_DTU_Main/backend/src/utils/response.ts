import { Response } from 'express';

export const sendSuccess = (res: Response, data: any, message: string = 'Success') => {
    return res.status(200).json({
        success: true,
        message,
        data,
    });
};

export const sendCreated = (res: Response, data: any, message: string = 'Created successfully') => {
    return res.status(201).json({
        success: true,
        message,
        data,
    });
};

export const sendError = (res: Response, statusCode: number, message: string, code?: string) => {
    return res.status(statusCode).json({
        success: false,
        message,
        code,
    });
};
