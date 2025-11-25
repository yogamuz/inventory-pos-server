const exportService = require("../services/export.service");

class ExportController {
  // Export history to Excel
  async exportHistoryToExcel(req, res) {
    try {
      const { days = 7 } = req.query;

      const workbook = await exportService.exportHistoryToExcel({ days });

      // Set response headers
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="Laporan Penjualan Bakso Aci Gg Leak ${days} Hari.xlsx"`
      );

      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new ExportController();