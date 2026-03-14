const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const checkAdminAuth = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/futsal-reservation';
    await mongoose.connect(mongoURI);
    
    console.log('=== CHECKING ADMIN AUTHENTICATION ===');
    
    const User = require('../models/User');
    
    // Check if admin user exists
    const adminUser = await User.findOne({ username: 'admin' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found!');
      console.log('💡 Run: npm run seed:admin');
      return;
    }
    
    console.log('✅ Admin user found:');
    console.log(`- Username: ${adminUser.username}`);
    console.log(`- Email: ${adminUser.email}`);
    console.log(`- Role: ${adminUser.role}`);
    console.log(`- Verified: ${adminUser.isverified}`);
    console.log(`- Created: ${adminUser.createdAt?.toLocaleDateString()}`);
    
    // Test password verification
    const isPasswordValid = await bcrypt.compare('admin123', adminUser.passwordHash);
    console.log(`- Password valid: ${isPasswordValid ? '✅' : '❌'}`);
    
    // Test JWT token generation
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: adminUser._id, username: adminUser.username, role: adminUser.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log('\n🔑 Test Token Generated:');
    console.log(`Token: ${token.substring(0, 50)}...`);
    console.log('✅ Token generation working');
    
    console.log('\n📋 Login Instructions:');
    console.log('1. Go to: http://localhost:5173/auth');
    console.log('2. Username: admin');
    console.log('3. Password: admin123');
    console.log('4. You will be redirected to: http://localhost:5173/admin');
    
  } catch (error) {
    console.error('❌ Error checking admin auth:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

// Run check
checkAdminAuth();
