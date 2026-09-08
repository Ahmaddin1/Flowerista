import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable.");
}

const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const globalWithMongoose = global;

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = {
    conn: null,
    promise: null,
  };
}

async function connectDB() {
  const cached = globalWithMongoose.mongoose;

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongooseInstance) => {
      console.log("Database connected successfully :)");
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectDB;
