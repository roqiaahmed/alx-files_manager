import { createHash } from "crypto";
import { getUserIdAndKey } from "../utils/user";
import { v4 as uuidv4 } from "uuid";
import dbClient from "../utils/db";
import redisClient from "../utils/redis";

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString();
    const [email, password] = credentials.split(":");

    if (!email || !password) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const hashedPassword = createHash("sha1").update(password).digest("hex");
    try {
      const user = await dbClient.getUserByEmail(email);

      if (!user || user.password !== hashedPassword) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = uuidv4();
      const key = `auth_${token}`;
      await redisClient.set(key, user._id.toString(), 86400);
      return res.status(200).send({ token });
    } catch (error) {
      console.error("Error signing in:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  static async getDisconnect(req, res) {
    const user = await getUserIdAndKey(req);
    if (!user) {
      return res.status(401).send("Unauthorized");
    }
    await redisClient.del(user.key);
    res.status(204).send();
  }
}

export default AuthController;
