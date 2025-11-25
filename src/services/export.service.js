const ExcelJS = require("exceljs");
const StockHistory = require("../models/StockHistory");

class ExportService {
  // Export history to Excel
  async exportHistoryToExcel(filters = {}) {
    const { days = 7 } = filters;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Get history data (only sales)
    const history = await StockHistory.find({
      type: "sale",
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ productName: 1, createdAt: -1 })
      .populate("productId", "price");

    // Group by product
    const productStats = {};
    history.forEach((item) => {
      if (!productStats[item.productId]) {
        productStats[item.productId] = {
          productName: item.productName,
          price: item.productId?.price || 0,
          totalSold: 0,
          totalRevenue: 0,
        };
      }
      productStats[item.productId].totalSold += item.quantity;
      productStats[item.productId].totalRevenue +=
        item.quantity * (item.productId?.price || 0);
    });

    // Convert to array
    const data = Object.values(productStats);

    // Calculate grand total
    const grandTotalSold = data.reduce((sum, item) => sum + item.totalSold, 0);
    const grandTotalRevenue = data.reduce(
      (sum, item) => sum + item.totalRevenue,
      0
    );

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Laporan Penjualan");

    // Set column widths
    worksheet.columns = [
      { key: "no", width: 8 },
      { key: "productName", width: 30 },
      { key: "price", width: 18 },
      { key: "totalSold", width: 12 },
      { key: "totalRevenue", width: 20 },
    ];

    // Add title
    worksheet.mergeCells("A1:E1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `LAPORAN PENJUALAN ${days} HARI TERAKHIR`;
    titleCell.font = { size: 14, bold: true };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    titleCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    worksheet.getRow(1).height = 25;

    // Add date range
    worksheet.mergeCells("A2:E2");
    const dateCell = worksheet.getCell("A2");
    dateCell.value = `Periode: ${startDate.toLocaleDateString(
      "id-ID"
    )} - ${endDate.toLocaleDateString("id-ID")}`;
    dateCell.font = { size: 11 };
    dateCell.alignment = { horizontal: "center", vertical: "middle" };
    dateCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    worksheet.getRow(2).height = 20;

    // Add empty row
    worksheet.addRow([]);

    // Add header
    const headerRow = worksheet.addRow([
      "No",
      "Nama Produk",
      "Harga",
      "Terjual",
      "Total Pendapatan",
    ]);
    headerRow.font = { bold: true, size: 11 };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.height = 22;

    // Add border to header
    headerRow.eachCell((cell) => {
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Add data rows
    data.forEach((item, index) => {
      const row = worksheet.addRow([
        index + 1,
        item.productName,
        item.price,
        item.totalSold,
        item.totalRevenue,
      ]);

      // Format currency
      row.getCell(3).numFmt = '"Rp"#,##0';
      row.getCell(5).numFmt = '"Rp"#,##0';

      // Alignment - semua center
      row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(5).alignment = { horizontal: "center", vertical: "middle" };

      // Add border
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      row.height = 18;
    });

    // Add grand total
    const totalRow = worksheet.addRow([
      "",
      "",
      "TOTAL",
      grandTotalSold,
      grandTotalRevenue,
    ]);
    totalRow.font = { bold: true, size: 11 };
    totalRow.getCell(3).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    totalRow.getCell(4).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    totalRow.getCell(5).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    totalRow.getCell(5).numFmt = '"Rp"#,##0';
    totalRow.height = 22;

    // Add border to total row
    totalRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    return workbook;
  }
}

module.exports = new ExportService();
