const mongoose = require('mongoose');

// Function to connect to the database
const connectDB = async () => {
  try {
    // Database URI from environment variable or local URI
    const dbURI = process.env.DB_URI || 'mongodb://localhost:27017/punjabcommute';

    // Connect to MongoDB using Mongoose
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1); // Exit the process if database connection fails
  }
};

// Export the function so it can be used in other files
module.exports = connectDB;
