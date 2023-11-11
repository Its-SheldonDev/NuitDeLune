const express = require("express");
const {
  signup,
  login,
  protect,
  forgotPassword,
  resetPassword,
  changePassword,
} = require("../controllers/authControllers");
const { me, updateMe } = require("../controllers/userControllers");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword/:token", resetPassword);

router.patch("/changePassword", protect, changePassword);

router.get("/me", protect, me);
router.patch("/updateMe", protect, updateMe);

module.exports = router;
