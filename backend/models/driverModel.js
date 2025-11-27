// models/driverModel.js
const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Driver name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Driver phone is required"],
      unique: true,
      trim: true,
    },
    shift: {
      type: String,
      enum: ["Morning", "Evening", "Night"],
      default: "Morning",
    },
    assignedBus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bus",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Driver", driverSchema);
