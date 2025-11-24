const express = require('express');
const router = express.Router();
const {
  createBus,
  getAllBuses,
  getBusById,
  updateBusLocation,
  updateBusStatus, // optional
  deleteBus        // optional
} = require('../controllers/busController');

router.get('/', getAllBuses);
router.get('/:id', getBusById);

// CREATE
router.post('/', createBus);

// UPDATE location
router.put('/:id', updateBusLocation);

// Optional convenience routes
router.patch('/:id/status', updateBusStatus);
router.delete('/:id', deleteBus);

module.exports = router;
