// scripts/createAdminDirect.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createAdminDirect = async () => {
  try {
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGO_URI);
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('admins');
    
    // Check if admin exists
    const existingAdmin = await collection.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('⚠️ Admin already exists with username: admin');
      console.log('Existing admin details:', {
        username: existingAdmin.username,
        email: existingAdmin.email,
        role: existingAdmin.role
      });
      await mongoose.disconnect();
      return;
    }

    // Hash password manually
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync('admin123', salt);

    // Create admin
    const admin = {
      username: 'admin',
      email: 'admin@elderlycommunity.com',
      password: hashedPassword,
      fullName: 'System Administrator',
      role: 'super_admin',
      permissions: [
        { module: 'users', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { module: 'posts', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { module: 'reports', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { module: 'analytics', canView: true, canCreate: false, canEdit: false, canDelete: false },
        { module: 'settings', canView: true, canCreate: true, canEdit: true, canDelete: true }
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    };

    const result = await collection.insertOne(admin);
    
    console.log('\n✅ Admin created successfully!');
    console.log('=================================');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Email: admin@elderlycommunity.com');
    console.log('Role: super_admin');
    console.log('=================================');
    console.log('Admin ID:', result.insertedId);
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    if (error.code === 11000) {
      console.error('Duplicate key error - admin may already exist');
    }
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createAdminDirect();