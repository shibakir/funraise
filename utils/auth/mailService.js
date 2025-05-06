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

        try {
            this.transporter.verify();
            console.log('SMTP connection is valid.');
        } catch (error) {
            console.error('Error verifying SMTP connection:', error.message);
        }
    }

    async sendActivationMail(to, link) {
        try {
            const info = await this.transporter.sendMail({
                from: process.env.SMTP_USER,
                to,
                subject: 'Funraise - activation',
                text: '',
                html:
                    `
                    <div>
                        <h1>Funraise new account activation:</h1>
                        <a href="${link}">${link}</a>
                    </div>
                `
            })
            console.log('Email sent successfully:', info);
            return true;
        } catch (error) {
            console.error('Error sending email:', error);
            return false;
        }
    }

}

module.exports = new MailService();