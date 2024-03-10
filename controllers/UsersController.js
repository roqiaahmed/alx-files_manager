// import getUserIdAndKey from '../utils/user';
import sha1 from "sha1";
import { getUser } from "../utils/user";
import utilsCollection from "../utils/collections";
// import { ObjectId } from 'mongodb';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).send({ error: "Missing email" });
    }

    if (!password) {
      return res.status(400).send({ error: "Missing password" });
    }

    try {
      const usersCollection = await utilsCollection("users");

      // Check if user already exists
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).send({ error: "Already exist" });
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
    const user = await getUser(req);
    console.log(`==================> ${user}`);
    if (!user) {
      return res.status(401).send({ error: "Unauthorized" });
    }
    res.status(201).send({ id: user._id, email: user.email });
    // const { userId } = await getUserIdAndKey(req);

    // if (!userId) {
    //   return res.status(401).send(`no user found in this id ${userId}`);
    // }
    // const usersCollection = await utilsCollection('users');

    // const { email } = await usersCollection.findOne({ _id: ObjectId(userId) });
    // if (!email) {
    //   return res.status(401).send('Unauthorized');
    // }
    // res.status(201).send({ id: userId, email });
  }
}

export default UsersController;
