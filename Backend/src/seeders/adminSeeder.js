const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const connectDB = require('../config/db');

const seedAdmin = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('Database connected successfully');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.username);
      process.exit(0);
    }

    // Create admin user
    const adminData = {
      username: 'admin',
      email: 'admin@futsal.com',
      password: 'admin123', // This will be hashed
      role: 'admin',
      isverified: true
    };

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);
    
    adminData.passwordHash = hashedPassword;
    delete adminData.password;

    // Create admin user
    const admin = new User(adminData);
    await admin.save();

    console.log('Admin user created successfully:');
    console.log('Username:', admin.username);
    console.log('Email:', admin.email);
    console.log('Role:', admin.role);
    console.log('Password: admin123 (change this after first login!)');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

// Run the seeder
seedAdmin();
