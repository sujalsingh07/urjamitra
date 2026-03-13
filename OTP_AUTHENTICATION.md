# Email OTP Authentication API Documentation

## Overview
Email-based OTP (One-Time Password) authentication has been integrated into the Urjamitra backend for secure email verification during signup.

## Environment Configuration
The following variables have been added to `.env`:
```
EMAIL_USER=emailurjamitra@gmail.com
EMAIL_PASSWORD=igpt tdhx rbam pvqb
```

## API Endpoints

### 1. Request OTP
**Endpoint:** `POST /api/auth/request-otp`

**Description:** Send an OTP to the user's email for verification.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent to your email. Please verify within 10 minutes.",
  "email": "user@example.com"
}
```

**Error Responses:**
- **400:** Email already registered
- **400:** Email not provided
- **500:** Failed to send OTP

---

### 2. Verify OTP
**Endpoint:** `POST /api/auth/verify-otp`

**Description:** Verify the OTP sent to the user's email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP verified successfully. You can now complete your signup.",
  "email": "user@example.com"
}
```

**Error Responses:**
- **400:** OTP not found
- **400:** OTP expired (after 10 minutes)
- **400:** Incorrect OTP (max 5 attempts)
- **400:** Email or OTP not provided

---

### 3. Signup with OTP
**Endpoint:** `POST /api/auth/signup-with-otp`

**Description:** Complete the signup process after OTP verification.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "securePassword123",
  "address": "123 Campus Street"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "user@example.com",
    "address": "123 Campus Street"
  },
  "message": "Signup successful! Welcome to Urjamitra."
}
```

**Error Responses:**
- **400:** Missing required fields
- **400:** OTP not verified
- **400:** Email already registered

---

## Frontend Integration Example

### Step 1: Request OTP
```javascript
const requestOTP = async (email) => {
  try {
    const response = await fetch('http://localhost:5001/api/auth/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Step 2: Verify OTP
```javascript
const verifyOTP = async (email, otp) => {
  try {
    const response = await fetch('http://localhost:5001/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Step 3: Complete Signup
```javascript
const signupWithOTP = async (userData) => {
  try {
    const response = await fetch('http://localhost:5001/api/auth/signup-with-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (data.success) {
      localStorage.setItem('token', data.token);
      console.log('Signup successful!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## Features

✅ **OTP Generation:** Generates a secure 6-digit OTP  
✅ **Email Delivery:** Sends OTP via Gmail SMTP  
✅ **Time Limit:** OTP expires after 10 minutes  
✅ **Attempt Limiting:** Max 5 failed verification attempts  
✅ **Auto-Deletion:** Expired OTPs are automatically removed  
✅ **Welcome Email:** Sends welcome email after successful signup  
✅ **Security:** OTPs are hashed and stored securely  

---

## Database Models

### OTP Model
```
{
  email: String (indexed, unique),
  otp: String,
  expiresAt: Date (auto-delete),
  verified: Boolean,
  attempts: Number,
  createdAt: Date
}
```

---

## Email Settings

Gmail SMTP Configuration:
- **Service:** Gmail
- **Port:** 587 (TLS)
- **From Address:** emailurjamitra@gmail.com

**Note:** The app password is used instead of the actual Gmail password for security.

---

## Security Considerations

1. **Never commit .env files** - Keep credentials private
2. **Use App Passwords** - Gmail requires app-specific passwords for SMTP
3. **Enable 2FA** - Set up 2-factor authentication on the Gmail account
4. **OTP Expiration** - OTPs are valid for only 10 minutes
5. **Attempt Limiting** - Failed attempts are tracked and limited to 5
6. **Auto-cleanup** - Expired OTPs are automatically deleted from database

---

## Troubleshooting

### OTP Email Not Received
1. Check if `nodemailer` is installed: `npm install nodemailer`
2. Verify .env credentials matches the email configuration
3. Check MongoDB connection
4. Review backend logs for errors

### OTP Expired
- OTP is valid for 10 minutes only
- Request a new OTP using the `/request-otp` endpoint

### Failed Verification
- Check the OTP entered is correct (case-sensitive)
- Ensure OTP is still within 10-minute window
- Maximum 5 failed attempts allowed

---

## Files Modified/Created

### Created:
- `backend/models/OTP.js` - OTP schema
- `backend/services/emailService.js` - Email sending service

### Modified:
- `backend/.env` - Added email configuration
- `backend/controllers/authController.js` - Added OTP methods
- `backend/routes/authRoutes.js` - Added OTP routes

### Dependencies Added:
- `nodemailer` - SMTP email client

---

## Next Steps

1. Update the frontend Login/Signup pages to support OTP flow
2. Add password reset via OTP feature
3. Implement account recovery options
4. Add email subscription management
5. Set up email templates for different notifications
