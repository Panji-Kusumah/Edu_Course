import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

const isProduction = process.env.NODE_ENV === 'production';

let transporter = null;
async function createTransporter() {
    if (isProduction) {
        const requiredConfig = [
            'SMTP_HOST',
            'SMTP_USER',
            'SMTP_PASS',
        ];
        const missingConfig = requiredConfig.filter(
            (key) => !process.env[key]
        );
        if (missingConfig.length > 0) {
            throw new Error(
                `Missing SMTP configuration: ${missingConfig.join(', ')}`
            );
        }
        const smtpTransporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            connectionTimeout: 10_000,
            greetingTimeout: 10_000,
            socketTimeout: 10_000,
        });
        await smtpTransporter.verify();
        logger.info('SMTP transporter verified successfully');
        return smtpTransporter;
    }
    // Development → Ethereal
    const testAccount = await nodemailer.createTestAccount();
    const etherealTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 10_000,
    });
    await etherealTransporter.verify();
    logger.info('Development SMTP transporter verified using Ethereal');
    return etherealTransporter;
}

export async function initializeMailer() {
    if (transporter) {
        return transporter;
    }
    transporter = await createTransporter();
    return transporter;
}

export async function sendEmail({
    to,
    subject,
    html,
    text,
}) {
    if (!transporter) {
        throw new Error(
            'Mailer has not been initialized. Call initializeMailer() during application startup.'
        );
    }
    const info = await transporter.sendMail({
        from:
            process.env.EMAIL_FROM ||
            'EduCourse <noreply@educourse.com>',
        to,
        subject,
        text,
        html,
    });
    logger.info({
        message: 'Email sent successfully',
        messageId: info.messageId,
        recipient: to,
    });
    if (!isProduction) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            logger.info({
                message: 'Ethereal email preview available',
                previewUrl,
            });
        }
    }
    return info;
}