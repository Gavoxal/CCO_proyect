import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Send an email using nodemailer.
 * @param {string | string[]} to - Recipient(s) email address.
 * @param {string} subject - Email subject.
 * @param {string} html - Email body HTML.
 * @returns {Promise<boolean>} True if sent successfully, false otherwise.
 */
export const sendEmail = async (to, subject, html) => {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn('⚠️ SMTP variables not configured. Skipping email send to:', to);
            return false;
        }

        const info = await transporter.sendMail({
            from: `"KidScam CCO" <${process.env.SMTP_USER}>`,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject,
            html
        });

        console.log(`✉️ Correo enviado a ${to}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('❌ Error enviando correo a', to, error);
        return false;
    }
};
