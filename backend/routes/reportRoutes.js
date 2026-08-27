const express = require("express");
const c = require("../controllers/reportController");
const auth = require("../middleware/authMiddleware");

const router = express.Router();
router.use(auth);

router.get("/summary", c.summary);
router.get("/monthly", c.monthly);
router.get("/notifications", c.notifications);

module.exports = router;
