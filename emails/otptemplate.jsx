export default function otpEmailTemplate({
  otp,
  appName = "FinTrack",
  action = "confirm your action",
  expiryMinutes = 5,
}) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appName} OTP Verification</title>
  </head>
  <body style="
    margin: 0;
    padding: 0;
    background-color: #0f172a;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: #e2e8f0;
  ">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="
            max-width: 480px;
            background: #1e293b;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid #334155;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
          ">
            <!-- Header Brand -->
            <tr>
              <td style="
                padding: 32px 32px 20px 32px;
                text-align: center;
                background: linear-gradient(135deg, #1e1b4b 0%, #1e293b 100%);
                border-bottom: 1px solid #334155;
              ">
                <div style="
                  display: inline-block;
                  width: 44px;
                  height: 44px;
                  line-height: 44px;
                  border-radius: 12px;
                  background: linear-gradient(135deg, #2563eb, #7c3aed);
                  color: white;
                  font-weight: 800;
                  font-size: 20px;
                  margin-bottom: 12px;
                ">
                  F
                </div>
                <h1 style="
                  margin: 0;
                  color: #f8fafc;
                  font-size: 22px;
                  font-weight: 700;
                  letter-spacing: -0.5px;
                ">
                  ${appName}
                </h1>
                <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">
                  Smart Personal Wealth & Budget Management
                </p>
              </td>
            </tr>

            <!-- Body Content -->
            <tr>
              <td style="padding: 32px;">
                <h2 style="
                  margin: 0 0 12px;
                  color: #f1f5f9;
                  font-size: 18px;
                  font-weight: 600;
                  text-align: center;
                ">
                  Authentication Code
                </h2>
                <p style="
                  margin: 0 0 28px;
                  color: #94a3b8;
                  font-size: 14px;
                  line-height: 1.6;
                  text-align: center;
                ">
                  Please use the one-time passcode below to <strong style="color: #cbd5e1;">${action}</strong>.
                </p>

                <!-- OTP Code Display -->
                <div style="text-align: center; margin-bottom: 28px;">
                  <div style="
                    display: inline-block;
                    background: #0f172a;
                    border: 1px solid #3b82f6;
                    border-radius: 12px;
                    padding: 16px 28px;
                    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.2);
                  ">
                    <span style="
                      font-family: 'SF Mono', Monaco, Consolas, monospace;
                      font-size: 32px;
                      font-weight: 800;
                      letter-spacing: 8px;
                      color: #60a5fa;
                      margin-right: -8px;
                    ">
                      ${otp}
                    </span>
                  </div>
                </div>

                <div style="
                  background: #0f172a;
                  border-radius: 8px;
                  padding: 12px 16px;
                  border-left: 3px solid #f59e0b;
                  margin-bottom: 24px;
                ">
                  <p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
                    ⚠️ This code will expire in <strong style="color: #f59e0b;">${expiryMinutes} minutes</strong>. Never share this code with anyone.
                  </p>
                </div>

                <p style="
                  margin: 0;
                  color: #64748b;
                  font-size: 12px;
                  line-height: 1.5;
                  text-align: center;
                ">
                  If you did not initiate this request, you can safely ignore this email or review your account activity.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="
                padding: 20px 32px;
                background: #111827;
                border-top: 1px solid #1f2937;
                text-align: center;
              ">
                <p style="margin: 0; color: #475569; font-size: 11px;">
                  © ${new Date().getFullYear()} ${appName} Inc. All rights reserved.
                </p>
                <p style="margin: 4px 0 0; color: #334155; font-size: 10px;">
                  This is an automated security transmission.
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
}
