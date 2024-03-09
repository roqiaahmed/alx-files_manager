const express = require("express");
import AppController from "../controllers/AppController";
import UsersController from "../controllers/UsersController";
import AuthController from "../controllers/AuthController";
import FilesController from "../controllers/FilesController";

const router = express.Router();

// GET status
router.get("/status", (req, res) => {
  AppController.getStatus(req, res);
});

//GET stats
router.get("/stats", (req, res) => {
  AppController.getStats(req, res);
});

//POST uSERS
router.post("/users", (req, res) => {
  UsersController.postNew(req, res);
});

//GET connect
router.get("/connect", (req, res) => {
  AuthController.getConnect(req, res);
});

//GET disconnect
router.get("/disconnect", (req, res) => {
  AuthController.getDisconnect(req, res);
});

//GET users/me
router.get("/users/me", (req, res) => {
  UsersController.getMe(req, res);
});

//POST /files
router.post("/files", (req, res) => {
  FilesController.postUpload(req, res);
});

//GET /files/:id
router.get("/files/:id", (req, res) => {
  FilesController.getShow(req, res);
});

//GET /files
router.get("/files", (req, res) => {
  FilesController.getIndex(req, res);
});

//PUT /files/:id/publish
router.put("/files/:id/publish", (req, res) => {
  FilesController.putPublish(req, res);
});

//PUT /files/:id/unpublish
router.put("/files/:id/unpublish", (req, res) => {
  FilesController.putUnpublish(req, res);
});

//GET /files/:id/data
router.get("/files/:id/data", (req, res) => {
  FilesController.getFile(req, res);
});

module.exports = router;
