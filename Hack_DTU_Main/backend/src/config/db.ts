import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || '');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
        process.exit(1);
    }
};
