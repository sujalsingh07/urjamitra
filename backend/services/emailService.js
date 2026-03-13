const nodemailer = require("nodemailer");

// Create a transporter using Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  connectionTimeout: 5000,
  socketTimeout: 5000,
});

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email (non-blocking with timeout)
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Urjamitra OTP for Email Verification",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px;">
          <h1>Urjamitra</h1>
          <p>Email Verification</p>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Hello,</p>
          <p>You requested to verify your email address. Please use the following OTP to complete your verification:</p>
          
          <div style="background-color: #4CAF50; color: white; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; margin: 20px 0;">
            ${otp}
          </div>
          
          <p><strong>Important:</strong> This OTP will expire in 10 minutes.</p>
          <p>If you did not request this OTP, please ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from Urjamitra. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending OTP email:", error);
    return false;
  }
};

// Send welcome email after successful verification
const sendWelcomeEmail = async (email, userName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Welcome to Urjamitra!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px;">
          <h1>Urjamitra</h1>
          <p>Welcome to Our Community!</p>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Hello ${userName},</p>
          <p>Welcome to Urjamitra! Your email has been successfully verified.</p>
          <p>You can now access all features of our platform including:</p>
          <ul>
            <li>Browse campus marketplace</li>
            <li>Create listings</li>
            <li>Connect with other users</li>
            <li>Send and receive messages</li>
          </ul>
          
          <p style="color: #666;">
            If you have any questions, feel free to contact our support team.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Best regards,<br>
            The Urjamitra Team
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending welcome email:", error);
    return false;
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendWelcomeEmail,
};
