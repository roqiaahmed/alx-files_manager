const express = require("express");
import AppController from "../controllers/AppController";
import UsersController from "../controllers/UsersController";
import AuthController from "../controllers/AuthController";

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

module.exports = router;
