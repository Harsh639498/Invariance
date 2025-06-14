const express = require("express");
const router = express.Router();
const authController = require("../controller/authController")

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.get("/allusers", authController.getAllUsers)

module.exports = router;
