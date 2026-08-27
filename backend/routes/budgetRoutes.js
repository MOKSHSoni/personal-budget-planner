const express = require("express");
const c = require("../controllers/budgetController");
const auth = require("../middleware/authMiddleware");
const { validateRequest } = require("../middleware/validateRequest");

const router = express.Router();
router.use(auth);

router.get("/", c.list);
router.get("/recommendation", validateRequest({ month: { type: "month" } }), c.recommend);
router.post(
  "/",
  validateRequest({
    category_id: { required: true, type: "int" },
    monthly_limit: { required: true, type: "amount" },
    priority: { required: true, type: "priority" },
  }),
  c.upsert
);
router.post("/apply-recommendation", validateRequest({ month: { type: "month" } }), c.applyRecommendation);
router.put("/:id", validateRequest({ monthly_limit: { type: "amount" }, priority: { type: "priority" } }), c.update);
router.delete("/:id", c.remove);

module.exports = router;
