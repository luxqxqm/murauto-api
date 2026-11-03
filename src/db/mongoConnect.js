import mongoose from 'mongoose';
export const mongoConnect = async () => {
  try {
    const link = process.env.MONGODB_URL;
    await mongoose.connect(link);
    console.log('Server succesfuly connected!');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};
