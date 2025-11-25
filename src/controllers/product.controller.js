const productService = require("../services/product.service");

class ProductController {
  // Get all products
  async getAllProducts(req, res) {
    try {
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
        isActive: req.query.isActive,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };

      const result = await productService.getAllProducts(filters);

      res.status(200).json({
        success: true,
        message: "Berhasil mengambil data produk",
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get product by ID
  async getProductById(req, res) {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);

      res.status(200).json({
        success: true,
        message: "Berhasil mengambil data produk",
        data: product,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

// Create product
  async createProduct(req, res) {
    try {
      const { name, price, stock } = req.body;
      const file = req.file; // Dari multer

      // Validation
      if (!name || !price) {
        return res.status(400).json({
          success: false,
          message: "Nama dan harga produk wajib diisi",
        });
      }

      const productData = {
        name,
        price,
        stock: stock || 0,
      };

      const product = await productService.createProduct(productData, file);

      res.status(201).json({
        success: true,
        message: "Produk berhasil ditambahkan",
        data: product,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

// Update product
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const { name, price, stock, isActive } = req.body;
      const file = req.file; // Dari multer

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (price !== undefined) updateData.price = price;
      if (stock !== undefined) updateData.stock = stock;
      if (isActive !== undefined) updateData.isActive = isActive;

      const product = await productService.updateProduct(id, updateData, file);

      res.status(200).json({
        success: true,
        message: "Produk berhasil diperbarui",
        data: product,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Delete product (soft delete)
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const result = await productService.deleteProduct(id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Hard delete product (permanent)
  async hardDeleteProduct(req, res) {
    try {
      const { id } = req.params;
      const result = await productService.hardDeleteProduct(id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Restock product
  async restockProduct(req, res) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Jumlah restock harus lebih dari 0",
        });
      }

      const product = await productService.restockProduct(id, quantity);

      res.status(200).json({
        success: true,
        message: `Berhasil menambah stok sebanyak ${quantity}`,
        data: product,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Record sale
  async recordSale(req, res) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Jumlah penjualan harus lebih dari 0",
        });
      }

      const product = await productService.recordSale(id, quantity);

      res.status(200).json({
        success: true,
        message: `Berhasil mencatat penjualan sebanyak ${quantity}`,
        data: product,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

// Adjust stock
  async adjustStock(req, res) {
    try {
      const { id } = req.params;
      const { stock, notes } = req.body;

      if (stock === undefined || stock < 0) {
        return res.status(400).json({
          success: false,
          message: "Jumlah stok tidak valid",
        });
      }

      const product = await productService.adjustStock(id, stock, notes);

      res.status(200).json({
        success: true,
        message: "Stok berhasil disesuaikan",
        data: product,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
  // Get dashboard stats
  async getDashboardStats(req, res) {
    try {
      const stats = await productService.getDashboardStats();

      res.status(200).json({
        success: true,
        message: "Berhasil mengambil statistik dashboard",
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get low stock products
  async getLowStockProducts(req, res) {
    try {
      const threshold = req.query.threshold || 5;
      const products = await productService.getLowStockProducts(threshold);

      res.status(200).json({
        success: true,
        message: "Berhasil mengambil produk dengan stok menipis",
        data: products,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new ProductController();