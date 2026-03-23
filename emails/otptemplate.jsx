export default function otpEmailTemplate({
  otp,
  appName = "FinTrack",
  action = "verify your action",
  expiryMinutes = 5
}) {

  return `
  <div style="
    margin:0;
    padding:0;
    background:#f4f6f8;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
  ">

    <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
      <tr>
        <td align="center">

          <table width="100%" cellpadding="0" cellspacing="0" style="
            max-width:420px;
            background:white;
            border-radius:12px;
            padding:24px;
            box-shadow:0 4px 14px rgba(0,0,0,0.06);
          ">

            <tr>
              <td style="text-align:center; padding-bottom:12px;">
                <h2 style="margin:0; color:#111;">${appName}</h2>
              </td>
            </tr>

            <tr>
              <td style="font-size:15px; color:#444; text-align:center;">
                Use the OTP below to ${action}.
              </td>
            </tr>

            <tr>
              <td style="padding:28px 0; text-align:center;">
                <div style="
                  font-size:28px;
                  letter-spacing:6px;
                  font-weight:600;
                  background:#f1f5f9;
                  padding:14px 22px;
                  border-radius:8px;
                  display:inline-block;
                ">
                  ${otp}
                </div>
              </td>
            </tr>

            <tr>
              <td style="font-size:13px; color:#666; text-align:center;">
                This OTP will expire in <b>${expiryMinutes} minutes</b>.
              </td>
            </tr>

            <tr>
              <td style="padding-top:18px; font-size:13px; color:#777; text-align:center;">
                If you did not request this, you can safely ignore this email.
              </td>
            </tr>

            <tr>
              <td style="
                padding-top:24px;
                font-size:11px;
                color:#aaa;
                text-align:center;
              ">
                © ${new Date().getFullYear()} ${appName}
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </div>
  `
}