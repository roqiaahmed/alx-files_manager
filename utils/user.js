import redisClient from "../utils/redis";
import utilsCollection from "../utils/collections";
import { ObjectId } from "mongodb";

const getUserIdAndKey = async (req) => {
  const xToken = req.header("X-Token");
  const key = `auth_${xToken}`;
  const user = await redisClient.get(key);

  if (!user) {
    return {};
  }
  const userToken = { key, userId: user };
  return userToken;
};

const getUser = async (req) => {
  const { userId } = await getUserIdAndKey(req);
  if (!userId) {
    return null;
  }

  let user;
  try {
    const usersCollection = await utilsCollection("users");
    user = await usersCollection.findOne({ _id: ObjectId(userId) });
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }

  if (!user) {
    return null;
  }

  return user;
};

export { getUserIdAndKey, getUser };
// export default getUserIdAndKey;
