import mongoose from "mongoose";
import dns from "dns";

// Configure DNS fallback servers only for local environment (avoid UDP DNS restrictions in AWS Lambda/Vercel)
if (!process.env.VERCEL && typeof dns.setServers === "function") {
  try {
    dns.setServers(["1.1.1.1", "8.8.8.8"]);
  } catch (e) {
    // Ignore if not supported in runtime
  }
}

// Global cached connection across serverless invocations
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB database using Mongoose ODM with serverless connection pooling
 */
const connectDB = async () => {
  if (cached.conn && mongoose.connection.readyState >= 1) {
    return cached.conn;
  }

  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI environment variable is missing!");
    throw new Error("MONGODB_URI environment variable is missing");
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
    };

    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongooseInstance) => {
      console.log(`✅ MongoDB Connected: ${mongooseInstance.connection.host}`);
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};

export default connectDB;
