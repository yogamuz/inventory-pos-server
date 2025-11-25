const StockHistory = require("../models/StockHistory");

class HistoryService {
  // Get all stock history with filters
  async getAllHistory(filters = {}) {
    const {
      page = 1,
      limit = 20,
      productName = "",
      type,
      startDate,
      endDate,
      today,
    } = filters;

    const query = {};

    // Filter by product name
    if (productName) {
      query.productName = { $regex: productName, $options: "i" };
    }

    // Filter by type (restock/sale/adjustment)
    if (type) {
      query.type = type;
    }

    // Filter by date range
    if (startDate || endDate || today) {
      query.createdAt = {};

      if (today === "true" || today === true) {
        // Filter hari ini
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        query.createdAt.$gte = startOfDay;
        query.createdAt.$lte = endOfDay;
      } else {
        // Filter by date range
        if (startDate) {
          query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.createdAt.$lte = end;
        }
      }
    }

    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      StockHistory.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("productId", "name imageUrl price stock"),
      StockHistory.countDocuments(query),
    ]);

    return {
      history,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get history by product ID
  async getHistoryByProductId(productId, filters = {}) {
    const { page = 1, limit = 20, type, startDate, endDate } = filters;

    const query = { productId };

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      StockHistory.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      StockHistory.countDocuments(query),
    ]);

    return {
      history,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get history stats
  async getHistoryStats(filters = {}) {
    const { startDate, endDate, today } = filters;

    const query = {};

    // Filter by date
    if (startDate || endDate || today) {
      query.createdAt = {};

      if (today === "true" || today === true) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        query.createdAt.$gte = startOfDay;
        query.createdAt.$lte = endOfDay;
      } else {
        if (startDate) {
          query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.createdAt.$lte = end;
        }
      }
    }

    const stats = await StockHistory.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
        },
      },
    ]);

    const result = {
      totalRestock: 0,
      totalSale: 0,
      totalAdjustment: 0,
      quantityRestocked: 0,
      quantitySold: 0,
    };

    stats.forEach((stat) => {
      if (stat._id === "restock") {
        result.totalRestock = stat.count;
        result.quantityRestocked = stat.totalQuantity;
      } else if (stat._id === "sale") {
        result.totalSale = stat.count;
        result.quantitySold = Math.abs(stat.totalQuantity);
      } else if (stat._id === "adjustment") {
        result.totalAdjustment = stat.count;
      }
    });

    return result;
  }
}

module.exports = new HistoryService();