import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { mkdirSync, writeFileSync } from "fs";
import fs from "fs";
import path from "path";
import utilsCollection from "../utils/collections";
import dbClient from "../utils/db";
const mimeTypes = require("mime-types");
import { getUser } from "../utils/user";

const FOLDER_PATH = process.env.FOLDER_PATH || "/tmp/files_manager";

class FilesController {
  static async postUpload(req, res) {
    const user = await getUser(req);
    if (!user) {
      return res.status(401).send({ error: "Unauthorized" });
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

    if (parentId !== 0) {
      const file = await dbClient.getFileByParentId(parentId);
      if (!file) {
        res.status(400).send({ error: "Parent not found" });
      }
      if (file.type !== "folder") {
        res.status(400).send({ error: "Parent is not a folder" });
      }
    }

    let localPath = "";
    const fileUUID = uuidv4();
    const filePath = path.join(FOLDER_PATH, fileUUID);

    if (type !== "folder") {
      try {
        fs.mkdirSync(FOLDER_PATH, { recursive: true });
      } catch (error) {
        console.error("Error creating directory:", error);
        return res.status(500).send("Error creating directory");
      }

      try {
        const decodedData = Buffer.from(data, "base64");
        fs.writeFileSync(filePath, decodedData);
        console.log("File created successfully:", filePath);
      } catch (error) {
        console.error("Error writing file:", error);
        return res.status(500).send("Error writing file");
      }
    }

    localPath = filePath;

    try {
      const newFile = await dbClient.createFile(
        user._id,
        name,
        type,
        parentId,
        isPublic,
        localPath
      );

      const responseFile = {
        id: newFile._id,
        userId: newFile.userId,
        name: newFile.name,
        type: newFile.type,
        isPublic: newFile.isPublic,
        parentId: newFile.parentId,
      };

      return res.status(201).json(responseFile);
    } catch (error) {
      console.log(error);
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
