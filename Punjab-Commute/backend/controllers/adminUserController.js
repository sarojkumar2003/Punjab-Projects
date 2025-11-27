// controllers/adminUserController.js
const User = require('../models/userModel');

// GET /api/admin/users  – list all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password'); // don't send password hash
    res.status(200).json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
};

// POST /api/admin/users – create new user (admin creates commuter/admin)
const createUserByAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Name, email and password are required' });
    }

    // check existing
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    // userModel has pre('save') hook to hash password
    const user = new User({
      name,
      email,
      password,
      role: role || 'commuter',
    });

    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;

    res.status(201).json(safeUser);
  } catch (err) {
    console.error('Error creating user by admin:', err);
    res.status(500).json({ message: 'Server error while creating user' });
  }
};

// PUT /api/admin/users/:id – update user
const updateUserByAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;

    // if password provided, set it; pre('save') will hash it
    if (password && password.trim().length > 0) {
      user.password = password;
    }

    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;

    res.status(200).json(safeUser);
  } catch (err) {
    console.error('Error updating user by admin:', err);
    res.status(500).json({ message: 'Server error while updating user' });
  }
};

// DELETE /api/admin/users/:id – delete user
const deleteUserByAdmin = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user by admin:', err);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
};

module.exports = {
  getAllUsers,
  createUserByAdmin,
  updateUserByAdmin,
  deleteUserByAdmin,
};
