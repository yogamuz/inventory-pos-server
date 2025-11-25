const mongoose = require("mongoose");

const stockHistorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["restock", "sale", "adjustment"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    stockBefore: {
      type: Number,
      required: true,
    },
    stockAfter: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
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
  }
);

// Index untuk query yang sering dipakai
stockHistorySchema.index({ productId: 1, createdAt: -1 });
stockHistorySchema.index({ type: 1, createdAt: -1 });
stockHistorySchema.index({ createdAt: -1 });
stockHistorySchema.index({ productName: 1 });

module.exports = mongoose.model("StockHistory", stockHistorySchema);