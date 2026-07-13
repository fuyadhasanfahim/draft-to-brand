import dns from 'node:dns';
import mongoose from 'mongoose';

// Node's resolver can fail the SRV lookup that `mongodb+srv://` URIs rely on
// (common on Windows / some ISP routers) even though the OS resolver handles
// it fine. Pinning to a public DNS resolver fixes it without touching system
// network settings.
dns.setServers(['8.8.8.8', '1.1.1.1']);

declare global {
    // eslint-disable-next-line no-var
    var mongooseConnection:
        | { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
        | undefined;
}

const cached = global.mongooseConnection ?? { conn: null, promise: null };
global.mongooseConnection = cached;

/** Reuses a single Mongoose connection across hot reloads and serverless invocations. */
export async function connectDB() {
    if (cached.conn) return cached.conn;

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error(
            'MONGODB_URI is not set. Add a MongoDB Atlas connection string to your environment.',
        );
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(uri, { bufferCommands: false });
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;
        throw error;
    }

    return cached.conn;
}
