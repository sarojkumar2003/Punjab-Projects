// routes/driverRoutes.js
const express = require("express");
const router = express.Router();

const {
  createDriver,
  getDrivers,
  updateDriver,
  deleteDriver,
  assignDriver,
} = require("../controllers/driverController");

// NOTE: for now no auth middleware, same style as your other routes
router.get("/", getDrivers);
router.post("/", createDriver);
router.put("/:id", updateDriver);
router.post("/assign", assignDriver);
router.delete("/:id", deleteDriver);

module.exports = router;
