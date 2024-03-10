import Queue from "bull";
import utilsCollection from "../utils/collections";

export const fileQueue = new Queue("fileQueue");

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!userId) {
    throw new Error("Missing userId");
  }
  if (!fileId) {
    throw new Error("Missing fileId");
  }
  const fileCollection = await utilsCollection("files");
  const file = await fileCollection.findOne({
    _id: ObjectId(fileId),
  });
  if (!file) {
    throw new Error("File not found");
  }

  await generateThumbnail(fileId);
});
