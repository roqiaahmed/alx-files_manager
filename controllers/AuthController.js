import sha1 from "sha1";
import getUserIdAndKey from "../utils/user";
import redisClient from "../utils/redis";
import { v4 as uuidv4 } from "uuid";
import utilsCollection from "../utils/collections";

class AuthController {
  static async getConnect(req, res) {
    if (
      !req.headers.authorization ||
      req.headers.authorization.indexOf("Basic ") === -1
    ) {
      return res.status(401).json({ error: "Missing Authorization Header" });
    }
    const base64Credentials = req.headers.authorization.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "utf-8"
    );
    const [email, password] = credentials.split(":");
    const hashedPassword = sha1(password);
    const usersCollection = await utilsCollection("users");
    const user = await usersCollection.findOne({
      email,
      password: hashedPassword,
    });
    if (!user) {
      return res.status(401).send("Unauthorized");
    }

    const token = uuidv4();
    const key = `auth_${token}`;
    const hoursForExpiration = 24;
    await redisClient.set(key, user._id.toString(), hoursForExpiration * 3600);
    return res.status(200).send({ token });
  }

  static async getDisconnect(req, res) {
    const user = getUserIdAndKey(req);
    if (!user) {
      return res.status(401).send("Unauthorized");
    }
    await redisClient.del(user.key);
    res.status(204).send();
  }
}

export default AuthController;
