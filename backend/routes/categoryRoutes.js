const express = require("express");
const c = require("../controllers/categoryController");
const auth = require("../middleware/authMiddleware");
const { validateRequest } = require("../middleware/validateRequest");

const router = express.Router();
router.use(auth);

router.get("/", c.list);
router.post("/restore-defaults", c.restoreDefaults);
router.post(
  "/",
  validateRequest({
    name: { required: true, type: "string", min: 1, max: 60 },
    type: { required: true, type: "categoryType" },
  }),
  c.create
);
router.put("/:id", validateRequest({ name: { type: "string", min: 1, max: 60 }, type: { type: "categoryType" } }), c.update);
router.delete("/:id", c.remove);

module.exports = router;
