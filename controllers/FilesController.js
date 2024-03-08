import { getUser } from "../utils/user";
import utilsCollection from "../utils/collections";
import { ObjectId } from "mongodb";
import fs from "fs";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const FOLDER_PATH = process.env.FOLDER_PATH || "/tmp/files_manager";

class FilesController {
  static async postUpload(req, res) {
    const user = await getUser(req);
    console.log("=============>" + user._id);
    if (!user) {
      return res.status(401).send("Unauthorized");
    }
    const { name, type, data, parentId = "0", isPublic = false } = req.body;
    console.log(
      `name ====> ${name}\n type ====> ${type}\n data ====> ${data}\n parentId ====> ${parentId}\n isPublic ====> ${isPublic}\n`
    );
    if (!name) {
      res.status(400).send({ error: "Missing name" });
    }

    if (!type || !["folder", "file", "image"].includes(type)) {
      res.status(400).send({ error: "Missing type" });
    }

    if (!data && type !== "folder") {
      res.status(400).send({ error: "Missing data" });
    }

    const fileCollection = await utilsCollection("files");

    if (parentId !== "0") {
      const file = await fileCollection.findOne({ _id: ObjectId(parentId) });
      if (!file) {
        res.status(400).send({ error: "Parent not found" });
      }
      if (file.type !== "folder") {
        res.status(400).send({ error: "Parent is not a folder" });
      }
    }

    if (type === "folder") {
      const newFolder = await fileCollection.insertOne({
        userId: ObjectId(user._id),
        name,
        type,
        parentId: ObjectId(parentId),
        isPublic,
      });
      return res.status(201).json(newFolder.ops[0]);
    }

    try {
      fs.mkdirSync(FOLDER_PATH, { recursive: true });
    } catch (error) {
      console.error("Error creating directory:", error);
      return res.status(500).send("Error creating directory");
    }

    const fileUUID = uuidv4();
    const filePath = path.join(FOLDER_PATH, fileUUID);

    try {
      const decodedData = Buffer.from(data, "base64");
      fs.writeFileSync(filePath, decodedData);
      console.log("File created successfully:", filePath);
    } catch (error) {
      console.error("Error writing file:", error);
      return res.status(500).send("Error writing file");
    }

    // Insert file into database
    const newFileData = {
      userId: ObjectId(user._id),
      name,
      type,
      isPublic,
      parentId: ObjectId(parentId),
      localPath: filePath,
    };

    try {
      // const fileCollection = await utilsCollection("files");
      const newFile = await fileCollection.insertOne(newFileData);
      return res.status(201).json(newFile);
    } catch (error) {
      console.error("Error inserting file into database:", error);
      return res.status(500).send("Error inserting file into database");
    }
  }
}
export default FilesController;