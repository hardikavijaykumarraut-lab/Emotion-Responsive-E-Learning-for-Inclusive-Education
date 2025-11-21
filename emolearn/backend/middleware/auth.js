const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Verify JWT token
const verifyToken = async (req, res, next) => {
  // Get token from header
  const authHeader = req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  console.log('Token verification attempt:', { 
    hasAuthHeader: !!authHeader, 
    authHeader: authHeader,
    hasToken: !!token,
    tokenLength: token ? token.length : 0,
    tokenPreview: token ? token.substring(0, Math.min(50, token.length)) : ''
  });
  
  if (!token) {
    console.log('No token provided in request');
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token verified successfully:', { userId: decoded.userId, role: decoded.role, email: decoded.email });
    
    // Update user's lastActive timestamp (if user exists)
    try {
      await User.findByIdAndUpdate(decoded.userId, { 
        lastActive: new Date() 
      });
    } catch (updateError) {
      console.warn('Failed to update user lastActive timestamp:', updateError);
      // Continue even if we can't update the timestamp
    }
    
    // Add user from payload
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    console.error('Token that failed verification:', token);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    console.log('Admin check for user:', req.user);
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      console.log('User not found in database:', req.user.userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('User found:', { id: user._id, role: user.role, email: user.email });
    
    if (user.role !== 'admin') {
      console.log('User is not admin:', { userId: user._id, userRole: user.role, requiredRole: 'admin' });
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    
    console.log('Admin check passed for user:', user._id);
    next();
  } catch (error) {
    console.error('Admin check failed:', error);
    res.status(500).json({ error: 'Server error during admin verification' });
  }
};

module.exports = {
  verifyToken,
  isAdmin
};