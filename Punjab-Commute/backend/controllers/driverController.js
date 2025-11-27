// controllers/driverController.js
const Driver = require("../models/driverModel");
const Bus = require("../models/busModel");

// CREATE DRIVER
exports.createDriver = async (req, res) => {
  try {
    const { name, phone, shift, isActive } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required" });
    }

    const exists = await Driver.findOne({ phone });
    if (exists) {
      return res.status(400).json({ message: "Driver with this phone already exists" });
    }

    const driver = await Driver.create({
      name,
      phone,
      shift: shift || "Morning",
      isActive: typeof isActive === "boolean" ? isActive : true,
    });

    res.status(201).json(driver);
  } catch (err) {
    console.error("Create driver error:", err);
    res.status(500).json({ message: "Driver creation failed", error: err.message });
  }
};

// GET ALL DRIVERS
exports.getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().populate("assignedBus", "busNumber route");
    res.json(drivers);
  } catch (err) {
    console.error("Get drivers error:", err);
    res.status(500).json({ message: "Failed to fetch drivers" });
  }
};

// UPDATE DRIVER (name / phone / shift / isActive)
exports.updateDriver = async (req, res) => {
  try {
    const updated = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate("assignedBus", "busNumber route");

    if (!updated) return res.status(404).json({ message: "Driver not found" });

    res.json(updated);
  } catch (err) {
    console.error("Update driver error:", err);
    res.status(500).json({ message: "Driver update failed" });
  }
};

// ASSIGN DRIVER TO BUS
exports.assignDriver = async (req, res) => {
  try {
    const { driverId, busId } = req.body;

    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ message: "Bus not found" });

    // clear any existing driver assigned to this bus (optional)
    if (bus.driver) {
      await Driver.updateOne(
        { _id: bus.driver },
        { $set: { assignedBus: null } }
      );
    }

    // Update bus with driver info
    bus.driver = driver._id;
    bus.driverName = driver.name;
    bus.driverPhone = driver.phone;
    await bus.save();

    // Update driver with assigned bus
    driver.assignedBus = busId;
    await driver.save();

    const populatedDriver = await Driver.findById(driver._id).populate(
      "assignedBus",
      "busNumber route"
    );

    res.json({
      message: "Driver assigned successfully",
      driver: populatedDriver,
      bus,
    });
  } catch (err) {
    console.error("Assign driver error:", err);
    res.status(500).json({ message: "Failed to assign driver" });
  }
};

// DELETE DRIVER
exports.deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    // Optional: clear driver info from bus
    if (driver.assignedBus) {
      await Bus.findByIdAndUpdate(driver.assignedBus, {
        $unset: { driver: "", driverName: "", driverPhone: "" },
      });
    }

    await Driver.findByIdAndDelete(req.params.id);

    res.json({ message: "Driver deleted" });
  } catch (err) {
    console.error("Delete driver error:", err);
    res.status(500).json({ message: "Driver deletion failed" });
  }
};
