const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const SALT_WORK_FACTOR = 10;

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  avatar: {
    type: String,
    default: null
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  lastLogout: {
    type: Date
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium'
    },
    highContrast: {
      type: Boolean,
      default: false
    },
    screenReader: {
      type: Boolean,
      default: false
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      achievements: { type: Boolean, default: true }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Skip hashing if password isn't modified
  if (!this.isModified('password')) return next();
  
  // For student users, only hash if it's not already hashed
  if (this.role === 'student') {
    // If password is already hashed, skip hashing
    if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
      return next();
    }
  }
  
  try {
    const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

// Compare password method 
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    console.log('No password set for user');
    return false;
  }
  
  try {
    // For admin users, do direct comparison since password is stored as plain text
    if (this.role === 'admin') {
      return candidatePassword === this.password;
    }
    
    // For student users, check if we need to migrate to hashed password
    if (this.role === 'student') {
      // If password is already hashed (starts with $2a$ or $2b$), use bcrypt
      if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
        return await bcrypt.compare(candidatePassword, this.password);
      }
      // Otherwise, do direct comparison (for backward compatibility)
      const isMatch = candidatePassword === this.password;
      
      // If password matches, hash it for future logins
      if (isMatch) {
        try {
          const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
          this.password = await bcrypt.hash(candidatePassword, salt);
          await this.save();
          console.log('Migrated student password to hashed version');
        } catch (hashError) {
          console.error('Error hashing password during login:', hashError);
        }
      }
      
      return isMatch;
    }
    
    // For non-student users, always use bcrypt
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
