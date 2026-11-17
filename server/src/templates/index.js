/**
 * Email templates for authentication and notification flows
 */

function baseLayout(title, content) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f6f8;
      margin: 0;
      padding: 24px;
      color: #1a202c;
    }
    .container {
      max-width: 520px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: #1e293b;
      padding: 24px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .body {
      padding: 32px 24px;
      line-height: 1.6;
    }
    .otp-code {
      display: inline-block;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: 6px;
      color: #2563eb;
      background: #eff6ff;
      border: 2px dashed #93c5fd;
      border-radius: 8px;
      padding: 12px 24px;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      background: #f8fafc;
      padding: 16px 24px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PeerLink</h1>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} PeerLink. All rights reserved.</p>
      <p>If you did not request this email, please ignore it.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function otpEmailTemplate(otp) {
  const content = `
    <h2>Verify Your Email</h2>
    <p>Thank you for signing up for PeerLink. Please use the following One-Time Password (OTP) to verify your email address:</p>
    <div style="text-align: center;">
      <div class="otp-code">${otp}</div>
    </div>
    <p>This code will expire in 10 minutes. Do not share this code with anyone.</p>
  `;
  return baseLayout('Verify Your Email - PeerLink', content);
}

export function forgotPasswordOtpEmailTemplate(otp) {
  const content = `
    <h2>Password Reset Request</h2>
    <p>We received a request to reset your PeerLink account password. Use the following code to proceed with the reset:</p>
    <div style="text-align: center;">
      <div class="otp-code">${otp}</div>
    </div>
    <p>This code will expire in 10 minutes. If you did not initiate this request, your account is safe and you can discard this email.</p>
  `;
  return baseLayout('Reset Your Password - PeerLink', content);
}

export function recoverAccountOtpEmailTemplate(otp) {
  const content = `
    <h2>Account Recovery Request</h2>
    <p>We received a request to recover your deleted PeerLink account. Use the following OTP code to restore access:</p>
    <div style="text-align: center;">
      <div class="otp-code">${otp}</div>
    </div>
    <p>This code will expire in 10 minutes.</p>
  `;
  return baseLayout('Recover Your Account - PeerLink', content);
}

export function accountRecoveredEmailTemplate() {
  const content = `
    <h2>Account Successfully Recovered</h2>
    <p>Your PeerLink account has been successfully restored and reactivated. You can now log in with your credentials.</p>
    <p>If you did not request this recovery, please contact support immediately.</p>
  `;
  return baseLayout('Account Recovered - PeerLink', content);
}

export default {
  otpEmailTemplate,
  forgotPasswordOtpEmailTemplate,
  recoverAccountOtpEmailTemplate,
  accountRecoveredEmailTemplate,
};
