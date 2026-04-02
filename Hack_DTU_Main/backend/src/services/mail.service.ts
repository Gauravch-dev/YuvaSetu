import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class MailService {
    private static instance: MailService;
    private transporter: nodemailer.Transporter;

    private constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
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
        } else {
            // Optional: Handle other statuses or return
            return;
        }

        try {
            await this.transporter.sendMail({
                from: process.env.EMAIL_USER,
                to,
                subject,
                html
            });
            console.log(`Email sent to ${to} for status ${status}`);
        } catch (error) {
            console.error('Error sending email:', error);
            // Don't generate a critical error to avoid blocking the main flow
        }
    }
}

export const mailService = MailService.getInstance();
