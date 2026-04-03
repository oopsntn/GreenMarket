import nodemailer from "nodemailer";

export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: Number(process.env.SMTP_PORT) || 465,
            secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendOTPEmail(to: string, code: string): Promise<{ success: boolean; message: string }> {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #2e7d32; margin: 0;">GreenMarket</h1>
                    <p style="color: #666; font-size: 14px;">Chợ Cây Cảnh Trực Tuyến</p>
                </div>
                <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; text-align: center;">
                    <h2 style="color: #333; margin-top: 0;">Mã xác thực của bạn</h2>
                    <p style="color: #555; font-size: 16px;">Vui lòng sử dụng mã dưới đây để hoàn tất quy trình xác minh email cho Shop của bạn trên GreenMarket.</p>
                    <div style="font-size: 32px; font-weight: bold; color: #2e7d32; letter-spacing: 5px; margin: 20px 0;">${code}</div>
                    <p style="color: #999; font-size: 12px;">Mã này sẽ hết hạn trong vòng 15 phút.</p>
                </div>
                <div style="margin-top: 20px; color: #777; font-size: 12px; text-align: center;">
                    <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ với bộ phận hỗ trợ.</p>
                    <p>&copy; 2026 GreenMarket Team. All rights reserved.</p>
                </div>
            </div>
        `;

        return this.sendMail(to, "Mã xác thực Email Shop - GreenMarket", html);
    }

    async sendSecurityWarningEmail(to: string, phone: string): Promise<{ success: boolean; message: string }> {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f44336; border-radius: 8px; padding: 20px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #f44336; margin: 0;">Cảnh báo bảo mật</h1>
                </div>
                <p>Chào bạn,</p>
                <p>Chúng tôi muốn thông báo rằng số điện thoại <strong>${phone}</strong> vừa được xóa khỏi thông tin liên lạc của Shop bạn trên hệ thống GreenMarket.</p>
                <p>Nếu bạn **không** thực hiện thay đổi này, tài khoản của bạn có thể đang bị xâm nhập. Vui lòng kiểm tra lại ngay lập tức hoặc liên hệ với chúng tôi.</p>
                <div style="margin-top: 20px; color: #777; font-size: 12px; text-align: center;">
                    <p>&copy; 2026 GreenMarket Team. All rights reserved.</p>
                </div>
            </div>
        `;

        return this.sendMail(to, "Cảnh báo bảo mật: Thay đổi thông tin Shop - GreenMarket", html);
    }

    private async sendMail(to: string, subject: string, html: string): Promise<{ success: boolean; message: string }> {
        try {
            const info = await this.transporter.sendMail({
                from: process.env.SMTP_FROM || '"GreenMarket" <no-reply@greenmarket.com>',
                to,
                subject,
                html,
            });
            console.log(`[EMAIL SERVICE] Email sent to ${to}: ${info.messageId}`);
            return { success: true, message: "Email sent successfully" };
        } catch (error: any) {
            console.error("[EMAIL SERVICE] Error sending email:", error.message);
            return { success: false, message: `Email failed: ${error.message}` };
        }
    }
}

export const emailService = new EmailService();
