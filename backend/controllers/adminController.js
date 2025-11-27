// controllers/adminController.js
const User = require('../models/userModel');

// POST /api/admin/set-key
// body: { adminKey: "newSecret123" }
const setAdminKey = async (req, res) => {
  try {
    const { adminKey } = req.body;

    if (!adminKey || adminKey.length < 4) {
      return res
        .status(400)
        .json({ message: 'Admin key must be at least 4 characters' });
    }

    // req.user is attached by auth middleware
    const user = await User.findById(req.user._id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can set this key' });
    }

    await user.setAdminKey(adminKey);
    await user.save();

    return res
      .status(200)
      .json({ message: 'Admin secret key updated successfully' });
  } catch (err) {
    console.error('Error setting admin key:', err);
    return res.status(500).json({ message: 'Server error', err });
  }
};

module.exports = {
  setAdminKey,
};
