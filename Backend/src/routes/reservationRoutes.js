const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { createReservation, getReservations, cancelReservationUser } = require('../controllers/reservationController');

const router = express.Router();

router.use(authMiddleware);
router.post('/', createReservation);
router.get('/', getReservations);
router.put('/:id/cancel', cancelReservationUser);

module.exports = router;
