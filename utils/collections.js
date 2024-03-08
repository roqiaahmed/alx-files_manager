import dbClient from "./db";

const utilsCollection = async (collectionName) => {
  const collection = await dbClient.client.db().collection(collectionName);
  return collection;
};
export default utilsCollection;
