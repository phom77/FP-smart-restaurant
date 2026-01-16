const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Hàm gửi mail chung
const sendEmail = async (to, subject, htmlContent) => {
    try {
        const info = await transporter.sendMail({
            from: `"Smart Restaurant" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: htmlContent
        });
        console.log(`📧 Email sent to ${to}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error("❌ Error sending email:", error);
        return false;
    }
};

// Template 1: Gửi email Reset Password
const sendResetPasswordEmail = async (email, token) => {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #d32f2f;">Yêu cầu đặt lại mật khẩu</h2>
            <p>Xin chào,</p>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại Smart Restaurant.</p>
            <p>Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu (Link có hiệu lực trong 15 phút):</p>
            <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #d32f2f; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Đặt lại mật khẩu</a>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.</p>
        </div>
    `;
    
    return await sendEmail(email, "Đặt lại mật khẩu - Smart Restaurant", html);
};

// Template 2: Gửi email Chào mừng/Verify (Dùng cho Register)
const sendWelcomeEmail = async (email, name) => {
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #2e7d32;">Chào mừng ${name} đến với Smart Restaurant!</h2>
            <p>Tài khoản của bạn đã được tạo thành công.</p>
            <p>Hãy quét mã QR tại bàn để bắt đầu gọi món nhé!</p>
        </div>
    `;
    return await sendEmail(email, "Chào mừng thành viên mới!", html);
};

// Template 3: Gửi email Xác thực tài khoản (Verify Email)
const sendVerificationEmail = async (email, token) => {
    // Link này sẽ dẫn về Frontend, Frontend sẽ gọi API verify
    const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h2 style="color: #1976d2;">Xác thực tài khoản</h2>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại Smart Restaurant.</p>
            <p>Vui lòng nhấn vào nút bên dưới để kích hoạt tài khoản của bạn:</p>
            <a href="${verifyLink}" style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Xác thực ngay</a>
            <p style="margin-top: 15px; font-size: 12px; color: #666;">Link này có hiệu lực trong 24 giờ.</p>
        </div>
    `;
    return await sendEmail(email, "Kích hoạt tài khoản Smart Restaurant", html);
};

module.exports = {
    sendResetPasswordEmail,
    sendWelcomeEmail,
    sendVerificationEmail 
};