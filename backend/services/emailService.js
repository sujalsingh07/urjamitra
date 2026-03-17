const nodemailer = require("nodemailer");

// Build a fresh transporter each call so .env is always current
const makeTransport = () => {
  const user = (process.env.EMAIL_USER || "").trim();
  const pass = (process.env.EMAIL_PASSWORD || "").replace(/\s+/g, "").trim();
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user, pass },
  });
};

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const sendOTPEmail = async (email, otp) => {
  const transport = makeTransport();
  if (!transport) {
    console.error("❌ EMAIL_USER / EMAIL_PASSWORD missing in .env");
    return false;
  }
  try {
    const from = (process.env.EMAIL_USER || "").trim();
    await transport.sendMail({
      from,
      to: email,
      subject: "Your Urjamitra OTP",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
          <div style="background:#f59e0b;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0">
            <h2 style="margin:0">☀️ Urjamitra — Email Verification</h2>
          </div>
          <div style="padding:28px;background:#fffdf5;border:1px solid #fde68a;border-top:none;border-radius:0 0 8px 8px">
            <p style="margin:0 0 16px;color:#451a03">Use the code below to complete your sign-up:</p>
            <div style="background:#451a03;color:#fef08a;font-size:36px;font-weight:900;letter-spacing:10px;text-align:center;padding:20px;border-radius:8px;margin:0 0 20px">
              ${otp}
            </div>
            <p style="margin:0;color:#92400e;font-size:13px">Expires in <strong>10 minutes</strong>. If you didn't request this, ignore this email.</p>
          </div>
        </div>`,
    });
    console.log(`✅ OTP email sent → ${email}`);
    return true;
  } catch (err) {
    console.error("❌ OTP email error:", err.message);
    return false;
  }
};

const sendWelcomeEmail = async (email, userName) => {
  const transport = makeTransport();
  if (!transport) return false;
  try {
    const from = (process.env.EMAIL_USER || "").trim();
    await transport.sendMail({
      from,
      to: email,
      subject: "Welcome to Urjamitra! ⚡",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
          <div style="background:#f59e0b;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0">
            <h2 style="margin:0">☀️ Welcome to Urjamitra, ${userName}!</h2>
          </div>
          <div style="padding:28px;background:#fffdf5;border:1px solid #fde68a;border-top:none;border-radius:0 0 8px 8px">
            <p style="color:#451a03">Your account is ready. Start sharing solar energy with your community!</p>
            <p style="color:#92400e;font-size:13px;margin:0">— The Urjamitra Team</p>
          </div>
        </div>`,
    });
    console.log(`✅ Welcome email sent → ${email}`);
    return true;
  } catch (err) {
    console.error("❌ Welcome email error:", err.message);
    return false;
  }
};

module.exports = { generateOTP, sendOTPEmail, sendWelcomeEmail };