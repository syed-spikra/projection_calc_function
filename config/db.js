// config/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();


const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_CONNECTION_STRING);
    console.log('MongoDB Connected..');
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};


export default connectDB;
// module.exports = connectDB;