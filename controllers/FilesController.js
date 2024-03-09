import { getUser } from "../utils/user";
import utilsCollection from "../utils/collections";
import { ObjectId } from "mongodb";
import fs from "fs";
import { mkdirSync, writeFileSync } from "fs";
const mimeTypes = require("mime-types");
import path from "path";
import { v4 as uuidv4 } from "uuid";

const FOLDER_PATH = process.env.FOLDER_PATH || "/tmp/files_manager";

class FilesController {
  static async postUpload(req, res) {
    const user = await getUser(req);
    if (!user) {
      return res.status(401).send("Unauthorized");
    }
    const { name, type, data, parentId = 0, isPublic = false } = req.body;

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

    if (parentId !== 0) {
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
        parentId: parentId,
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
      parentId: parentId,
      localPath: filePath,
    };

    try {
      // const fileCollection = await utilsCollection("files");
      const newFile = await fileCollection.insertOne(newFileData);
      return res.status(201).json(newFile.ops[0]);
    } catch (error) {
      console.error("Error inserting file into database:", error);
      return res.status(500).send("Error inserting file into database");
    }
  }

  static async getShow(req, res) {
    const user = await getUser(req);
    if (!user) {
      return res.status(401).send("Unauthorized");
    }
    const { id: fileId } = req.params;
    const fileCollection = await utilsCollection("files");
    const file = await fileCollection.findOne({
      _id: ObjectId(fileId),
      userId: user._id,
    });
    if (!file) {
      res.status(404).send({ error: "Not found" });
    }
    res.status(200).send(file);
  }

  static async getIndex(req, res) {
    const user = await getUser(req);

    if (!user) {
      return res.status(401).send("Unauthorized");
    }
    const { parentId = 0, page = 1 } = req.query;
    const pageSize = 20;
    const fileCollection = await utilsCollection("files");

    const filesCursor = await fileCollection
      .aggregate([
        { $match: { parentId, userId: user._id } },
        {
          $facet: {
            data: [{ $skip: pageSize * (page - 1) }, { $limit: pageSize }],
          },
        },
      ])
      .toArray();
    const files = filesCursor[0];
    console.log(files.data);
    res.status(200).send(files.data);
  }

  static async putPublish(req, res) {
    const user = await getUser(req);
    if (!user) {
      return res.status(401).send("Unauthorized");
    }
    const { id: fileId } = req.params;
    const fileCollection = await utilsCollection("files");
    const file = await fileCollection.findOneAndUpdate(
      {
        _id: ObjectId(fileId),
        userId: user._id,
      },
      { $set: { isPublic: true } }
    );
    if (!file) {
      res.status(404).send({ error: "Not found" });
    }
    res.status(200).send(file.value);
  }

  static async putUnpublish(req, res) {
    const user = await getUser(req);
    if (!user) {
      return res.status(401).send("Unauthorized");
    }
    const { id: fileId } = req.params;
    const fileCollection = await utilsCollection("files");
    const file = await fileCollection.findOneAndUpdate(
      {
        _id: ObjectId(fileId),
        userId: user._id,
      },
      { $set: { isPublic: false } }
    );
    if (!file) {
      res.status(404).send({ error: "Not found" });
    }
    res.status(200).send(file.value);
  }

  static async getFile(req, res) {
    const user = await getUser(req);

    if (!user) {
      return res.status(401).send("Unauthorized");
    }

    const { id: fileId } = req.params;
    const fileCollection = await utilsCollection("files");
    try {
      const file = await fileCollection.findOne({
        _id: ObjectId(fileId),
      });

      if (!file) {
        return res.status(404).send({ error: "Not found" });
      }
      // console.log(`user._id =======================> ${user._id}`);
      // console.log(`file.userId =======================> ${file.userId}`);
      if (!file.isPublic && (!user || user._id !== file.userId)) {
        return res.status(404).send({ error: "Not found" });
      }

      if (file.type === "folder") {
        return res.status(400).send({ error: "A folder doesn't have content" });
      }

      const filePath = path.join(__dirname, FOLDER_PATH, file.name);
      // console.log(`=======================> ${filePath}`);
      if (!fs.existsSync(filePath)) {
        return res.status(404).send({ error: "Not found" });
      }
      const mimeType = mimeTypes.lookup(file.name);

      // Read the content of the file
      const fileContent = fs.readFileSync(filePath);

      // Set response headers with the MIME-type and send the file content
      res.setHeader("Content-Type", mimeType);
      res.status(200).send(fileContent);
    } catch (error) {
      console.log(error);
    }
    const { parentId = 0, page = 1 } = req.query;
    const pageSize = 20;

    const filesCursor = await fileCollection
      .aggregate([
        { $match: { parentId, userId: user._id } },
        {
          $facet: {
            data: [{ $skip: pageSize * (page - 1) }, { $limit: pageSize }],
          },
        },
      ])
      .toArray();
    const files = filesCursor[0];
    console.log(files.data);
    res.status(200).send(files.data);
  }
}
export default FilesController;
