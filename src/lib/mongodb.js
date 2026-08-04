import mongoose from "mongoose";

function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Global caching mechanism to prevent Mongoose from opening a fresh connection
// on every single API request, which avoids exhausting MongoDB pool sockets.
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  // If connection is already alive and ready, return it immediately
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // Read and validate MONGODB_URI HERE, at call time, not at module import time.
  // Next.js's build step statically imports every route module (including ones that import
  // this file) to collect page data — if this check ran at the top of the module instead, it
  // would throw and crash the entire production build the moment MONGODB_URI is unset in the
  // build environment, even though the app would run fine once the runtime env var is present.
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    };

    cached.promise = withTimeout(
      mongoose.connect(MONGODB_URI, opts),
      35000,
      "Timed out connecting to MongoDB"
    ).then((mongooseInstance) => {
      return mongooseInstance;
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

export { dbConnect, dbConnect as connectToDB, dbConnect as connectDB, dbConnect as connectToDatabase };
export default dbConnect;