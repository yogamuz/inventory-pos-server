const fetch = require("node-fetch");

class EmailService {
  constructor() {
    this.apiKey = process.env.RESEND_API_KEY;
    this.apiUrl = "https://api.resend.com/emails";
    this.fromEmail = process.env.EMAIL_FROM 
  }

  async sendEmail({ to, subject, html }) {
    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [to],
          subject: subject,
          html: html,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send email");
      }

      return data;
    } catch (error) {
      console.error("Email sending error:", error);
      throw new Error("Failed to send email");
    }
  }

  async sendPasswordResetEmail(email, resetToken, username) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const expiryMinutes = 10;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Password</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #2563eb; padding: 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Reset Password</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                        Halo <strong>${username}</strong>,
                      </p>
                      
                      <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                        Kami menerima permintaan untuk mereset password akun Anda. Klik tombol di bawah ini untuk melanjutkan proses reset password.
                      </p>
                      
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <a href="${resetUrl}" style="display: inline-block; padding: 14px 40px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">Reset Password</a>
                          </td>
                        </tr>
                      </table>

                      
                      <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                        Link ini akan kedaluwarsa dalam <strong>${expiryMinutes} menit</strong>. Jika Anda tidak melakukan permintaan ini, abaikan email ini dan password Anda tidak akan berubah.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #666666; font-size: 12px; line-height: 1.5; text-align: center;">
                        Email ini dikirim secara otomatis. Mohon tidak membalas email ini.
                      </p>
                      <p style="margin: 10px 0 0; color: #666666; font-size: 12px; line-height: 1.5; text-align: center;">
                        &copy; ${new Date().getFullYear()} Inventory POS. All rights reserved.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: "Reset Password - Inventory POS",
      html: html,
    });
  }
}

module.exports = new EmailService();