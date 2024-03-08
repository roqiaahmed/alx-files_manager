import getUserIdAndKey from "../utils/user";
import utilsCollection from "../utils/collections";
import { ObjectId } from "mongodb";

import sha1 from "sha1";

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      res.status(400).send({ error: "Missing email" });
    }

    if (!password) {
      res.status(400).send({ error: "Missing password" });
    }

    try {
      const usersCollection = await utilsCollection("users");

      // Check if user already exists
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        res.status(400).send({ error: "User already exists" });
        return;
      }
      const hashedPassword = sha1(password);
      const newUser = await usersCollection.insertOne({
        email,
        password: hashedPassword,
      });
      const userId = newUser.insertedId;
      res.status(201).send({ id: userId, email });
    } catch (error) {
      console.log(error);
    }
  }

  static async getMe(req, res) {
    const { userId } = await getUserIdAndKey(req);
    console.log(
      `user ===========================================================>>>> ${userId}`
    );

    if (!userId) {
      return res.status(401).send(`no user found in this id ${userId}`);
    }
    const usersCollection = await utilsCollection("users");

    const { email } = await usersCollection.findOne({ _id: ObjectId(userId) });
    if (!email) {
      return res.status(401).send("Unauthorized");
    }
    res.status(201).send({ id: userId, email });
  }
}

export default UsersController;