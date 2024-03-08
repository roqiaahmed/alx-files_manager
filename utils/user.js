import redisClient from "../utils/redis";

const getUserIdAndKey = async (req) => {
  const xToken = req.header("X-Token");
  const key = `auth_${xToken}`;
  const user = await redisClient.get(key);

  if (!user) {
    return {};
  }
  console.log(`fromuserutils ========> ${user}`);
  const userToken = { key, userId: user };
  return userToken;
};

export default getUserIdAndKey;
