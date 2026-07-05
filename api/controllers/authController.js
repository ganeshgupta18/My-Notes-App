import User from '../models/User.js';
import Notification from '../models/Notification.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

export const registerUser = async (req, res) => {
  const { name, email, password, profileImage } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      profileImage: profileImage || '',
    });

    if (user) {
      await Notification.create({
        userId: user._id,
        type: 'success',
        message: `Welcome, ${user.name}! Enjoy organized note-taking.`,
      });

      return res.status(201).json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        token: generateToken(user._id),
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const authUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password');
    if (user && (await user.matchPassword(password))) {
      return res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        token: generateToken(user._id),
      });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user with that email was found' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    // Build absolute URL for client
    const clientUrl = process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    // Mail options
    const mailOptions = {
      from: `"My Notes Support" <${process.env.EMAIL_USER || 'no-reply@mynotes.com'}>`,
      to: user.email,
      subject: 'My Notes Password Reset Request',
      text: `Reset password request link:\n\n${resetUrl}\n\nThis link is active for 10 minutes.`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #7c3aed; text-align: center; margin-top: 0;">My Notes Password Reset</h2>
          <p style="color: #4a5568; font-size: 16px;">Hello ${user.name},</p>
          <p style="color: #4a5568; font-size: 16px;">We received a request to reset the password for your My Notes account. Click the button below to proceed:</p>
          <div style="text-align: center; margin: 35px 0;">
            <a href="${resetUrl}" style="background-color: #7c3aed; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.4);">Reset Password</a>
          </div>
          <p style="color: #4a5568; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
          <p style="color: #718096; font-size: 12px; text-align: center;">This link will expire in 10 minutes.</p>
        </div>
      `,
    };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const cleanPass = process.env.EMAIL_PASS.replace(/\s/g, '');
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: cleanPass,
        },
      });

      await transporter.sendMail(mailOptions);
      return res.json({ success: true, message: 'Password reset link sent to your email.' });
    } else {
      console.log('======= PASSWORD RESET URL (NO EMAIL CONFIG) =======');
      console.log(resetUrl);
      console.log('====================================================');
      return res.json({
        success: true,
        message: 'Email configuration is missing. Link printed to console (local fallback).',
        devToken: resetToken, // Exposed in development mode so user can follow link directly
      });
    }
  } catch (error) {
    console.error('Password reset email error:', error);
    return res.status(500).json({ success: false, message: 'Email could not be sent' });
  }
};

export const resetPassword = async (req, res) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    await Notification.create({
      userId: user._id,
      type: 'warning',
      message: 'Your account password has been successfully reset.',
    });

    return res.json({ success: true, message: 'Password reset successful!' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
