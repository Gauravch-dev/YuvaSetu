import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class MailService {
    private static instance: MailService;
    private transporter: nodemailer.Transporter;

    private constructor() {
        console.log('--- Initializing MailService ---');
        console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'PRESENT' : 'MISSING');
        console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'PRESENT' : 'MISSING');

        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // Use SSL
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    public static getInstance(): MailService {
        if (!MailService.instance) {
            MailService.instance = new MailService();
        }
        return MailService.instance;
    }

    public async sendStatusUpdateEmail(to: string, jobTitle: string, companyName: string, status: string, name: string): Promise<void> {
        let subject = '';
        let html = '';

        if (status === 'SHORTLISTED') {
            subject = `Good News! You've been Shortlisted for ${jobTitle}`;
            html = `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Hi ${name},</h2>
                    <p>We are excited to inform you that your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been <strong>SHORTLISTED</strong>.</p>
                    <p>The employer has reviewed your profile and found it to be a good match.</p>
                    <p>Stay tuned for further updates!</p>
                    <br>
                    <p>Best regards,</p>
                    <p>The YuvaSetu Team</p>
                </div>
            `;
        } else if (status === 'INTERVIEW') {
            subject = `Interview Call: ${jobTitle} at ${companyName}`;
            html = `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Hi ${name},</h2>
                    <p>Congratulations! You have been invited for an interview for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
                    <p>The employer will reach out to you shortly with more details regarding the schedule and process.</p>
                    <p>Good luck!</p>
                    <br>
                    <p>Best regards,</p>
                    <p>The YuvaSetu Team</p>
                </div>
            `;
        } else if (status === 'REJECTED') {
            subject = `Application Update: ${jobTitle} at ${companyName}`;
            html = `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Hi ${name},</h2>
                    <p>Thank you for your interest in the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
                    <p>After careful consideration, the employer has decided not to move forward with your application at this time.</p>
                    <p>We appreciate the time you took to apply and wish you the best of luck in your search.</p>
                    <br>
                    <p>Best regards,</p>
                    <p>The YuvaSetu Team</p>
                </div>
            `;
        } else if (status === 'OFFER') {
            subject = `Exciting News! Job Offer for ${jobTitle} at ${companyName}`;
            html = `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Hi ${name},</h2>
                    <p>Congratulations! We are thrilled to inform you that <strong>${companyName}</strong> has extended a job offer to you for the position of <strong>${jobTitle}</strong>.</p>
                    <p>The employer will be contacting you shortly with the formal offer details and next steps.</p>
                    <br>
                    <p>Best regards,</p>
                    <p>The YuvaSetu Team</p>
                </div>
            `;
        } else {
            // Optional: Handle other statuses or return
            return;
        }

        try {
            console.log(`Attempting to send email to ${to} for job: ${jobTitle}, status: ${status}`);
            await this.transporter.sendMail({
                from: `"YuvaSetu" <${process.env.EMAIL_USER}>`,
                to,
                subject,
                html
            });
            console.log(`Email successfully sent to ${to}`);
        } catch (error) {
            console.error('CRITICAL EMAIL ERROR:', error);
            // Don't generate a critical error to avoid blocking the main flow
        }
    }
}

export const mailService = MailService.getInstance();
