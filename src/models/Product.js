const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nama produk wajib diisi"],
      trim: true,
      maxlength: [200, "Nama produk maksimal 200 karakter"],
    },
    price: {
      type: Number,
      required: [true, "Harga produk wajib diisi"],
      min: [0, "Harga tidak boleh negatif"],
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Stok tidak boleh negatif"],
    },
    sold: {
      type: Number,
      default: 0,
      min: [0, "Jumlah terjual tidak boleh negatif"],
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: [0, "Total pendapatan tidak boleh negatif"],
    },
    imageUrl: {
      type: String,
      default: null,
      trim: true,
    },
    imagePublicId: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastRestockedAt: {
      type: Date,
      default: null,
    },
    lastSoldAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        const id = ret._id;
        delete ret._id;
        delete ret.__v;
        return { id, ...ret };
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        const id = ret._id;
        delete ret._id;
        delete ret.__v;
        return { id, ...ret };
      },
    },
  }
);

// Index untuk pencarian
productSchema.index({ name: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ createdAt: -1 });

// Method untuk update stock setelah penjualan
productSchema.methods.recordSale = async function (quantity) {
  if (this.stock < quantity) {
    throw new Error("Stok tidak mencukupi");
  }

  const stockBefore = this.stock;
  this.stock -= quantity;
  this.sold += quantity;
  this.totalRevenue += quantity * this.price;
  this.lastSoldAt = new Date();

  // Save product first
  await this.save();

  // Create history record
  const StockHistory = require("./StockHistory");
  await StockHistory.create({
    productId: this._id,
    productName: this.name,
    type: "sale",
    quantity,
    stockBefore,
    stockAfter: this.stock,
  });

  return this;
};

// Method untuk restock
productSchema.methods.restock = async function (quantity) {
  if (quantity <= 0) {
    throw new Error("Jumlah restock harus lebih dari 0");
  }

  const stockBefore = this.stock;
  this.stock += quantity;
  this.lastRestockedAt = new Date();

  // Save product first
  await this.save();

  // Create history record
  const StockHistory = require("./StockHistory");
  await StockHistory.create({
    productId: this._id,
    productName: this.name,
    type: "restock",
    quantity,
    stockBefore,
    stockAfter: this.stock,
  });

  return this;
};

// Method untuk adjust stock (manual correction)
productSchema.methods.adjustStock = async function (newStock, notes = null) {
  if (newStock < 0) {
    throw new Error("Stok tidak boleh negatif");
  }

  const stockBefore = this.stock;
  this.stock = newStock;

  // Save product first
  await this.save();

  // Create history record
  const StockHistory = require("./StockHistory");
  await StockHistory.create({
    productId: this._id,
    productName: this.name,
    type: "adjustment",
    quantity: newStock - stockBefore,
    stockBefore,
    stockAfter: newStock,
    notes,
  });

  return this;
};

module.exports = mongoose.model("Product", productSchema);
