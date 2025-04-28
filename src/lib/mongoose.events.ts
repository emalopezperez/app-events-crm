import mongoose, { type Mongoose } from "mongoose"

const MONGODB_URL = process.env.MONGODB_URI

if (!MONGODB_URL) {
  console.error("Missing MONGODB_URI")
}

interface MongooseConnection {
  conn: mongoose.Connection | null
  promise: Promise<mongoose.Connection> | null
}


let cached: MongooseConnection = (global as any).mongoose_data

if (!cached) {
  cached = (global as any).mongoose_data = {
    conn: null,
    promise: null,
  }
}

export const connectToEventData = async () => {
  if (cached.conn) return cached.conn

  if (!MONGODB_URL) throw new Error("Missing MONGODB_URI")


  cached.promise = cached.promise || mongoose.createConnection(MONGODB_URL).asPromise()

  cached.conn = await cached.promise

  return cached.conn
}
