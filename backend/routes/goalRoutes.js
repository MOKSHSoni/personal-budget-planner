const express = require("express");
const c = require("../controllers/goalController");
const auth = require("../middleware/authMiddleware");
const { validateRequest } = require("../middleware/validateRequest");

const router = express.Router();
router.use(auth);

router.get("/", c.list);
router.get("/:id", c.getOne);
router.post(
  "/",
  validateRequest({
    goal_name: { required: true, type: "string", min: 1, max: 100 },
    target_amount: { required: true, type: "amount" },
    saved_amount: { type: "amount" },
    deadline: { type: "date" },
    priority: { required: true, type: "priority" },
  }),
  c.create
);
router.post("/:id/contribute", validateRequest({ amount: { required: true, type: "amount" } }), c.contribute);
router.put(
  "/:id",
  validateRequest({ goal_name: { type: "string", min: 1, max: 100 }, target_amount: { type: "amount" }, saved_amount: { type: "amount" }, deadline: { type: "date" }, priority: { type: "priority" } }),
  c.update
);
router.delete("/:id", c.remove);

module.exports = router;
