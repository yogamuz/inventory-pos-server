const express = require("express");
const exportController = require("../controllers/export.controller");
const { protect } = require("../middlewares/auth");

const router = express.Router();

// All routes are protected
router.use(protect);

// Export history to Excel
router.get("/history", exportController.exportHistoryToExcel);

module.exports = router;