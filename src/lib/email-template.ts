export const emailTemplate = (otp: number, name: string) => `
<!DOCTYPE html>
<html>
<head>
<title>OTP Verification</title>
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
  .container { max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 5px; }
  .header { font-size: 24px; font-weight: bold; color: #1E3A8A; margin-bottom: 20px; }
  .otp-code { font-size: 36px; font-weight: bold; color: #34D399; margin: 20px 0; letter-spacing: 5px; }
  .footer { margin-top: 20px; font-size: 12px; color: #888; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">CareerLink Account Verification</div>
    <p>Hello ${name},</p>
    <p>Thank you for registering with CareerLink. Please use the following One-Time Password (OTP) to verify your email address.</p>
    <div class="otp-code">${otp}</div>
    <p>This OTP is valid for 3 minutes. Please do not share this code with anyone.</p>
    <div class="footer">
      <p>&copy; 2024 CareerLink. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
