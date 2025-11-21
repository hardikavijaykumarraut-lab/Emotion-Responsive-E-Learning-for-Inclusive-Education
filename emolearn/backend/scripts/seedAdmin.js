const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/emolearn', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@emolearn.com' });
    const adminPassword = 'admin123';

    if (existingAdmin) {
      console.log('Admin user exists, updating password...');
      existingAdmin.password = adminPassword; // Store plain text password
      await existingAdmin.save();
      console.log('✅ Admin password has been updated');
      console.log('Email: admin@emolearn.com');
      console.log('Password: admin123');
      
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create admin user with plain text password
    const admin = new User({
      name: 'Admin User',
      email: 'admin@emolearn.com',
      password: adminPassword, // Store plain text password
      role: 'admin',
      isActive: true
    });
    
    await admin.save();

    console.log('\n✅ Admin user created successfully!');
    console.log('Email: admin@emolearn.com');
    console.log('Password: admin123');
    console.log('Role: admin');
    console.log('\nYou can now log in with these credentials.\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

createAdminUser();
