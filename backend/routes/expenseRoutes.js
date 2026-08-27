const express = require("express");
const c = require("../controllers/expenseController");
const auth = require("../middleware/authMiddleware");
const { validateRequest } = require("../middleware/validateRequest");

const router = express.Router();
router.use(auth);

router.get("/", c.list);
router.get("/by-category/:month", c.byCategory);
router.post(
  "/",
  validateRequest({
    category_id: { required: true, type: "int" },
    amount: { required: true, type: "amount" },
    date: { required: true, type: "date" },
    description: { type: "string", max: 255 },
  }),
  c.create
);
router.put(
  "/:id",
  validateRequest({ category_id: { type: "int" }, amount: { type: "amount" }, date: { type: "date" }, description: { type: "string", max: 255 } }),
  c.update
);
router.delete("/:id", c.remove);

module.exports = router;
