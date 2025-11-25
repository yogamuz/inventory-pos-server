const Product = require("../models/Product");
const cloudinaryService = require("./cloudinary.service");

class ProductService {
  // Get all products with pagination & filters
  async getAllProducts(filters = {}) {
    const {
      page = 1,
      limit = 10,
      search = "",
      isActive,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    const query = {};

    // Search by name
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === "true" || isActive === true;
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [products, total] = await Promise.all([
      Product.find(query).sort(sort).skip(skip).limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    return {
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get product by ID
  async getProductById(productId) {
    const product = await Product.findById(productId);

    if (!product) {
      throw new Error("Produk tidak ditemukan");
    }

    return product;
  }

// Create new product
  async createProduct(productData, file = null) {
    const { image, ...restData } = productData;

    // Upload image if provided (from file upload)
    if (file) {
      const uploadResult = await cloudinaryService.uploadFromBuffer(file.buffer);
      restData.imageUrl = uploadResult.url;
      restData.imagePublicId = uploadResult.publicId;
    }
    // Fallback: support base64 if image string provided
    else if (image) {
      const uploadResult = await cloudinaryService.uploadImage(image);
      restData.imageUrl = uploadResult.url;
      restData.imagePublicId = uploadResult.publicId;
    }

    const product = await Product.create(restData);
    return product;
  }

  
// Update product
  async updateProduct(productId, updateData, file = null) {
    const product = await Product.findById(productId);

    if (!product) {
      throw new Error("Produk tidak ditemukan");
    }

    const { image, ...restData } = updateData;

    // Handle image update from file upload
    if (file) {
      const uploadResult = await cloudinaryService.replaceImageFromBuffer(
        file.buffer,
        product.imageUrl
      );
      restData.imageUrl = uploadResult.url;
      restData.imagePublicId = uploadResult.publicId;
    }
    // Fallback: support base64 if image string provided
    else if (image) {
      const uploadResult = await cloudinaryService.replaceImage(
        image,
        product.imageUrl
      );
      restData.imageUrl = uploadResult.url;
      restData.imagePublicId = uploadResult.publicId;
    }

    // Update fields
    Object.keys(restData).forEach((key) => {
      if (restData[key] !== undefined) {
        product[key] = restData[key];
      }
    });

    await product.save();
    return product;
  }

  // Delete product (soft delete)
  async deleteProduct(productId) {
    const product = await Product.findById(productId);

    if (!product) {
      throw new Error("Produk tidak ditemukan");
    }

    product.isActive = false;
    await product.save();

    return { message: "Produk berhasil dihapus" };
  }

  // Hard delete product
  async hardDeleteProduct(productId) {
    const product = await Product.findById(productId);

    if (!product) {
      throw new Error("Produk tidak ditemukan");
    }

    // Delete image from Cloudinary if exists
    if (product.imagePublicId) {
      await cloudinaryService.deleteImage(product.imagePublicId);
    }

    await Product.findByIdAndDelete(productId);

    return { message: "Produk berhasil dihapus permanen" };
  }

  // Restock product
  async restockProduct(productId, quantity) {
    const product = await Product.findById(productId);

    if (!product) {
      throw new Error("Produk tidak ditemukan");
    }

    await product.restock(quantity);

    return product;
  }

  // Record sale
  async recordSale(productId, quantity) {
    const product = await Product.findById(productId);

    if (!product) {
      throw new Error("Produk tidak ditemukan");
    }

    if (!product.isActive) {
      throw new Error("Produk tidak aktif");
    }

    await product.recordSale(quantity);

    return product;
  }

  // Adjust stock manually
  async adjustStock(productId, newStock, notes = null) {
    const product = await Product.findById(productId);

    if (!product) {
      throw new Error("Produk tidak ditemukan");
    }

    await product.adjustStock(newStock, notes);

    return product;
  }

// Get dashboard statistics
async getDashboardStats() {
  const [totalProducts, activeProducts, lowStock, stats, topProducts] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ stock: { $lt: 10 }, isActive: true }),
    Product.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalRevenue" },
          totalStock: { $sum: "$stock" },
          totalSold: { $sum: "$sold" },
        },
      },
    ]),
    Product.find({ isActive: true, sold: { $gt: 0 } })
      .sort({ sold: -1 })
      .limit(5)
      .select('name sold totalRevenue imageUrl price'),
  ]);

  return {
    totalProducts,
    activeProducts,
    lowStockProducts: lowStock,
    totalRevenue: stats[0]?.totalRevenue || 0,
    totalStock: stats[0]?.totalStock || 0,
    totalSold: stats[0]?.totalSold || 0,
    topProducts,
  };
}

  // Get low stock products
  async getLowStockProducts(threshold = 5) {
    const products = await Product.find({
      stock: { $lt: threshold },
      isActive: true,
    }).sort({ stock: 1 });

    return products;
  }
}

module.exports = new ProductService();