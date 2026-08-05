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
    // Tuned for a serverless/edge execution model (Cloudflare Workers) talking to an Atlas M0
    // free-tier cluster. M0 is shared, lower-priority infrastructure with a low connection cap —
    // it can be genuinely slow or flaky under the connection pattern Cloudflare's globally
    // distributed edge creates (many short-lived connection attempts from different locations).
    // Timeouts are kept short so a failing connection fails FAST and returns a clear error,
    // instead of hanging until Cloudflare's own Worker execution limit forcibly kills the
    // request (which is what "Worker's code had hung" meant in your logs).
    const opts = {
      bufferCommands: false,
      maxPoolSize: 1, // One connection per isolate — Workers are short-lived, not a persistent
                       // long-running Node process, so a large pool doesn't help and adds
                       // connection-setup overhead per cold start.
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      socketTimeoutMS: 10000,
    };

    cached.promise = withTimeout(
      mongoose.connect(MONGODB_URI, opts),
      9000,
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

// Safe wrapper for Server Components (page.js files). Server Components have no default error
// boundary here — an uncaught throw crashes the whole Worker (Cloudflare "Error 1101: Worker
// threw exception"), even if the calling code has a try/catch, if that try/catch was ever
// accidentally omitted or doesn't wrap this call specifically. This wrapper CANNOT throw — it
// always returns a result object, so a page.js can never forget to handle a connection failure.
// API routes should keep using dbConnect() directly (they rely on it throwing for their
// existing try/catch → 500 JSON response pattern) — only page.js Server Components should use
// this instead.
export async function safeDbConnect() {
  try {
    const conn = await dbConnect();
    return { ok: true, conn, error: null };
  } catch (err) {
    console.error("safeDbConnect: connection failed:", err);
    return { ok: false, conn: null, error: err };
  }
}