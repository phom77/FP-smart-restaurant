const nodemailer = require('nodemailer');

// Sử dụng Gmail SMTP (Cần App Password) hoặc Mailtrap để test
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Cần thêm vào .env
        pass: process.env.EMAIL_PASS  // Cần thêm vào .env (App Password, KHÔNG phải pass đăng nhập)
    }
});

const sendEmail = async (to, subject, htmlContent) => {
    try {
        const info = await transporter.sendMail({
            from: `"Smart Restaurant" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: htmlContent
        });
        console.log("Email sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};

module.exports = sendEmail;