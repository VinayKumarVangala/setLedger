const mongoose = require('mongoose');

class SimpleDatabase {
  static async connect() {
    try {
      const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/setledger';
      
      // Try to connect to MongoDB
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000, // 5 second timeout
      });
      
      console.log('✅ Connected to MongoDB');
      return true;
    } catch (error) {
      console.log('⚠️  MongoDB not available, using in-memory storage');
      
      // Use in-memory MongoDB for testing
      const { MongoMemoryServer } = require('mongodb-memory-server');
      
      try {
        const mongod = new MongoMemoryServer();
        await mongod.start();
        const uri = mongod.getUri();
        
        await mongoose.connect(uri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        
        console.log('✅ Connected to in-memory MongoDB');
        return true;
      } catch (memError) {
        console.log('⚠️  Using mock database for basic functionality');
        return false;
      }
    }
  }

  static async disconnect() {
    try {
      await mongoose.disconnect();
      console.log('📴 Disconnected from database');
    } catch (error) {
      console.error('Error disconnecting from database:', error);
    }
  }
}

module.exports = SimpleDatabase;