const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Progress = require('../models/Progress');
const jwt = require('jsonwebtoken');

// JWT secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'student' } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    
    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password, // Password will be hashed by the pre-save hook in the User model
      role
    });

    // Save user to database
    await newUser.save();

    // Create progress record for the new user
    const progress = new Progress({ userId: newUser._id });
    progress.initializeDefaultAchievements();
    await progress.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (excluding password) and token
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        token
      },
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      message: error.message 
    });
  }
});

// User login
router.post('/login', async (req, res) => {
  const { email, password, role = 'student' } = req.body;
  
  // Input validation
  if (!email || !password) {
    console.log('Login failed: Missing credentials', { email: email ? 'provided' : 'missing' });
    return res.status(400).json({ 
      success: false,
      error: 'Email and password are required' 
    });
  }
  
  try {
    // Find user by email (case-insensitive)
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Check if user exists
    if (!user) {
      console.log('Login failed: User not found', { email });
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }
    
    // Role-based access control
    if (role === 'admin' && user.role !== 'admin') {
      console.log('Login failed: Admin access denied', { 
        email, 
        requestedRole: role, 
        userRole: user.role 
      });
      return res.status(403).json({ 
        success: false,
        error: 'Admin access denied' 
      });
    }
    
    // Compare passwords
    console.log('Comparing password for user:', user.email);
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      console.log('Login failed: Invalid password', { email });
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }
    
    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Prepare user response without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    // Return success response
    console.log('Login successful', { userId: user._id, role: user.role });
    return res.status(200).json({
      success: true,
      data: {
        user: userResponse,
        token,
        role: user.role
      },
      message: 'Login successful'
    });
    
  } catch (error) {
    console.error('Login error:', {
      error: error.message,
      stack: error.stack,
      email,
      time: new Date().toISOString()
    });
    
    res.status(500).json({ 
      success: false,
      error: 'Login failed',
      message: 'An error occurred during login. Please try again.'
    });
  }
});

// Get user profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    // Remove sensitive fields that shouldn't be updated directly
    delete updates.password;
    delete updates._id;
    delete updates.createdAt;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});


// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// Protected route example
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Add isAdmin flag
    const userResponse = user.toObject();
    userResponse.isAdmin = user.role === 'admin' || user.role === 'educator';
    
    res.json({
      success: true,
      user: userResponse // Return as 'user' not 'data' for compatibility
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Logout route
router.post('/logout', verifyToken, async (req, res) => {
  try {
    // For JWT tokens, we can't actually invalidate them on the server side
    // But we can update the user's last logout time
    await User.findByIdAndUpdate(req.user.userId, { 
      lastLogout: new Date() 
    });
    
    res.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to logout' 
    });
  }
});

module.exports = router;
