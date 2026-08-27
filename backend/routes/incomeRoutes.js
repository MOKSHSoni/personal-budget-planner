const express = require("express");
const c = require("../controllers/incomeController");
const auth = require("../middleware/authMiddleware");
const { validateRequest } = require("../middleware/validateRequest");

const router = express.Router();
router.use(auth);

router.get("/", c.list);
router.get("/total/:month", c.monthlyTotal);
router.post(
  "/",
  validateRequest({
    source: { required: true, type: "string", min: 1, max: 100 },
    amount: { required: true, type: "amount" },
    month: { type: "month" },
  }),
  c.create
);
router.put("/:id", validateRequest({ source: { type: "string", min: 1, max: 100 }, amount: { type: "amount" }, month: { type: "month" } }), c.update);
router.delete("/:id", c.remove);

module.exports = router;
