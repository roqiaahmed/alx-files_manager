import { MongoClient } from "mongodb";

class DBClient {
  constructor() {
    this.port = process.env.DB_PORT || 27017;
    this.host = process.env.DB_HOST || "localhost";
    this.db = process.env.DB_DATABASE || "files_manager";
    const dbURL = `mongodb://${this.host}:${this.port}/${this.db}`;
    this.client = new MongoClient(dbURL, { useUnifiedTopology: true });
    this.client.connect();
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    const user = await this.client.db().collection("users").countDocuments();
    return user;
  }

  async nbFiles() {
    const files = await this.client.db().collection("files").countDocuments();
    return files;
  }
}

const dbClient = new DBClient();
export default dbClient;