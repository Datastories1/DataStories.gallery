import mongoose from "mongoose";

// Global caching variables tailored for Serverless / Cloudflare Workers
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function dbConnect() {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable in your Cloudflare dashboard/environment variables.");
  }

  // If connection is alive and healthy, return it immediately
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If a connection promise is already in flight, await it to prevent socket exhaustion
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 1, // Crucial for serverless to prevent open socket leaks
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    }).catch((error) => {
      cached.promise = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Safe wrapper for Server Components to completely eliminate Error 1101 crashes
export async function safeDbConnect() {
  try {
    // Wrap database connection with a tight 6-second timeout race
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("MongoDB connection timeout on Cloudflare")), 6000)
    );

    const conn = await Promise.race([dbConnect(), timeoutPromise]);
    return { ok: true, conn, error: null };
  } catch (err) {
    console.error("safeDbConnect caught an error:", err.message);
    return { ok: false, conn: null, error: err };
  }
}

export { dbConnect as connectToDB, dbConnect as connectDB, dbConnect as connectToDatabase };
export default dbConnect;