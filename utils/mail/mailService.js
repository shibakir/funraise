const nodemailer = require('nodemailer');

class MailService {

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            }
        })

        // Check SMTP connection
        this.transporter.verify()
            .then(() => {
                console.log('SMTP connection is valid.');
            })
            .catch((error) => {
                console.error('Error verifying SMTP connection:', error.message);
            });
    }

    async sendActivationMail(to, link) {
        try {
            const info = await this.transporter.sendMail({
                from: process.env.SMTP_USER,
                to,
                subject: 'Funraise App: new user activation!',
                text: '',
                html:
                    `
                    <div>
                        <h1>Funraise activation</h1>
                        <p>Click the link below to activate your account:</p>
                        <a href="${link}">${link}</a>

                        <p>If you did not request this activation, please ignore this email.</p>
                        <p>Thank you for using Funraise!</p>
                        <p>Best regards,</p>
                        <p>Funraise Team</p>
                    </div>
                `
            })
            //console.log('Email sent successfully:', info);
            return true;
        } catch (error) {
            //console.error('Error sending email:', error);
            return false;
        }
    }

}

module.exports = new MailService();