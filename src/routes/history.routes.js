const express = require("express");
const historyController = require("../controllers/history.controller");
const { protect } = require("../middlewares/auth");

const router = express.Router();

// All routes are protected
router.use(protect);

// Get all history with filters
router.get("/", historyController.getAllHistory);

// Get history stats
router.get("/stats", historyController.getHistoryStats);

// Get history by product ID
router.get("/product/:productId", historyController.getHistoryByProductId);

module.exports = router;