const express = require("express");
const c = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");
const { validateRequest } = require("../middleware/validateRequest");

const router = express.Router();

router.post(
  "/register",
  validateRequest({
    name: { required: true, type: "string", min: 2, max: 100 },
    email: { required: true, type: "email" },
    password: { required: true, type: "string", min: 6, max: 72 },
  }),
  c.register
);

router.post(
  "/login",
  validateRequest({
    email: { required: true, type: "email" },
    password: { required: true, type: "string", min: 1 },
  }),
  c.login
);

router.post("/logout", auth, c.logout);
router.get("/profile", auth, c.getProfile);
router.put(
  "/profile",
  auth,
  validateRequest({
    name: { type: "string", min: 2, max: 100 },
    email: { type: "email" },
    salary_date: { type: "int" },
    currency: { type: "currency" },
    theme: { type: "theme" },
    password: { type: "string", min: 6, max: 72 },
  }),
  c.updateProfile
);

module.exports = router;
