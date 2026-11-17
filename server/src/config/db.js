import mongoose from 'mongoose';
import envConfig from './env.config.js';

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(envConfig.MONGO_URL);
    console.log('DB connected successfully!');
  } catch (err) {
    console.error('Error connecting DB:', err);
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState === 0) return;
  try {
    await mongoose.connection.close();
    console.log('DB disconnected successfully!');
  } catch (err) {
    console.error('Error disconnecting DB:', err);
  }
}

export default { connectDB, disconnectDB };
