import mongoose from "mongoose";
import dns from "dns";

// Configure DNS fallback servers for reliable MongoDB Atlas connection resolution
dns.setServers([
  "1.1.1.1",
  "8.8.8.8"
]);

/**
 * Connect to MongoDB database using Mongoose ODM
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
