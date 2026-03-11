import mongoose from 'mongoose';
const connectDB = async () => {
  try { const c = await mongoose.connect(process.env.MONGODB_URI); console.log(`✅ MongoDB: ${c.connection.host}`); }
  catch (e) { console.error(`❌ MongoDB: ${e.message}`); process.exit(1); }
};
export default connectDB;
