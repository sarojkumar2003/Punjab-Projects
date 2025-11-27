// routes/busRoutes.js
const express = require('express');
const router = express.Router();
const {
  createBus,
  getAllBuses,
  getBusById,
  updateBusLocation,
  updateBusStatus,
  deleteBus,
} = require('../controllers/busController');

router.get('/', getAllBuses);
router.get('/:id', getBusById);

// CREATE
router.post('/', createBus);

// LIVE UPDATE: location
router.put('/:id', updateBusLocation);

// STATUS UPDATE
router.patch('/:id/status', updateBusStatus);

// DELETE
router.delete('/:id', deleteBus);

module.exports = router;
