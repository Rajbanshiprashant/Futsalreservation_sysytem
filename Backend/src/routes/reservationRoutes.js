const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { createReservation, getReservations } = require('../controllers/reservationController');

const router = express.Router();

router.use(authMiddleware);
router.post('/', createReservation);
router.get('/', getReservations);

module.exports = router;
