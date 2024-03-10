import redisClient from "../utils/redis";
import utilsCollection from "../utils/collections";
import dbClient from "../utils/db";
import { ObjectId } from "mongodb";

const getUserIdAndKey = async (req) => {
  const xToken = req.header("X-Token");
  const key = `auth_${xToken}`;
  const userId = await redisClient.get(key);

  if (!userId) {
    return {};
  }
  const userToken = { key, userId };
  return userToken;
};

const getUser = async (req) => {
  const { userId } = await getUserIdAndKey(req);
  if (!userId) {
    return null;
  }

  try {
    const user = await dbClient.getUserById(userId);

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};

export { getUserIdAndKey, getUser };
