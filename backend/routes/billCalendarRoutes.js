const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const billCalendarController = require("../controllers/billCalendarController");

router.use(auth);

router.get("/", billCalendarController.getMonthCalendar);
router.post("/reminders", billCalendarController.createReminder);
router.put("/reminders/:id", billCalendarController.updateReminder);
router.delete("/reminders/:id", billCalendarController.deleteReminder);
router.post("/pay", billCalendarController.quickPay);

module.exports = router;
