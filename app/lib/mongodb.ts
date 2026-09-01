
// Import MongoClient dari package mongodb
import { MongoClient } from "mongodb";

// Jika environment variable MONGODB_URI tidak ada, memunculkan eror
if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MongoDB URI to .env.local");
}

// GET URI dari environment
const uri = process.env.MONGODB_URI;

const options = {};

// Variabel client MongoDB
let client: MongoClient;

// Variabel promise koneksi
let clientPromise: Promise<MongoClient>;

// Jika aplikasi berjalan di mode development
if (process.env.NODE_ENV === "development") {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  // Jika belum ada koneksi di global
  if (!globalWithMongo._mongoClientPromise) {
    // create client baru
    client = new MongoClient(uri, options);

    // Simpan promise koneksi ke global
    globalWithMongo._mongoClientPromise = client.connect();
  }

  // use koneksi dari global
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // Jika production
  // create client baru
  client = new MongoClient(uri, options);

  // Langsung connect
  clientPromise = client.connect();
}

// Export promise koneksi MongoDB
export default clientPromise;