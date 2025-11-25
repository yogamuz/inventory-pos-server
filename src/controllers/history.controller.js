const historyService = require("../services/history.service");

class HistoryController {
  // Get all history with filters
  async getAllHistory(req, res) {
    try {
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        productName: req.query.productName,
        type: req.query.type,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        today: req.query.today,
      };

      const result = await historyService.getAllHistory(filters);

      res.status(200).json({
        success: true,
        message: "Berhasil mengambil riwayat stok",
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get history by product ID
  async getHistoryByProductId(req, res) {
    try {
      const { productId } = req.params;
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        type: req.query.type,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const result = await historyService.getHistoryByProductId(
        productId,
        filters
      );

      res.status(200).json({
        success: true,
        message: "Berhasil mengambil riwayat produk",
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get history stats
  async getHistoryStats(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        today: req.query.today,
      };

      const stats = await historyService.getHistoryStats(filters);

      res.status(200).json({
        success: true,
        message: "Berhasil mengambil statistik riwayat",
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new HistoryController();