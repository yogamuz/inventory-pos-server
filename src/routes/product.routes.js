const express = require("express");
const productController = require("../controllers/product.controller");
const upload = require("../middlewares/upload");
const { protect } = require("../middlewares/auth");

const router = express.Router();

// All routes are protected (need authentication)
router.use(protect);

// Dashboard stats
router.get("/stats", productController.getDashboardStats);

// Low stock products
router.get("/low-stock", productController.getLowStockProducts);

// CRUD operations
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.post("/", upload.single("image"), productController.createProduct);
router.put("/:id", upload.single("image"), productController.updateProduct);

// ✅ PENTING: Hard delete HARUS SEBELUM route /:id
router.delete("/:id/hard", productController.hardDeleteProduct);
router.delete("/:id", productController.deleteProduct);

// Stock operations
router.post("/:id/restock", productController.restockProduct);
router.post("/:id/sale", productController.recordSale);
router.patch("/:id/adjust", productController.adjustStock);

module.exports = router;