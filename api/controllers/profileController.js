import User from '../models/User.js';
import Note from '../models/Note.js';
import Notification from '../models/Notification.js';

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, email, profileImage, password } = req.body;

    user.name = name || user.name;
    user.email = email || user.email;
    
    if (profileImage !== undefined) {
      user.profileImage = profileImage;
    }

    if (password) {
      user.password = password;
    }

    const updatedUser = await user.save();

    await Notification.create({
      userId: user._id,
      type: 'success',
      message: 'Your profile has been updated.',
    });

    return res.json({
      success: true,
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      profileImage: updatedUser.profileImage,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // Clean up all related resources
    await Note.deleteMany({ userId });
    await Notification.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    return res.json({
      success: true,
      message: 'Your profile and all data have been deleted successfully.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
