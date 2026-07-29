import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/fallback_db";

if (!process.env.MONGODB_URI && process.env.NODE_ENV !== "production") {
  console.warn("Please define the MONGODB_URI environment variable inside .env.local");
}

function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Cloudflare Workers tears down a request's sockets once that request ends. A
// mongoose connection (or its pool) cached across requests/isolates can end up
// referencing dead sockets and hang forever waiting on them, so every call
// disconnects any previous connection and opens a fresh one for this request
// instead of reusing state from an earlier invocation.
async function dbConnect() {
  if (mongoose.connection.readyState !== 0) {
    try {
      await withTimeout(mongoose.disconnect(), 3000, "Timed out disconnecting stale MongoDB connection");
    } catch {
      // Previous connection was already dead/stuck; proceed to reconnect regardless.
    }
  }

  return withTimeout(
    mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      dbName: "test",
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    }),
    8000,
    "Timed out connecting to MongoDB"
  );
}

export { dbConnect, dbConnect as connectToDB, dbConnect as connectDB, dbConnect as connectToDatabase };
export default dbConnect;