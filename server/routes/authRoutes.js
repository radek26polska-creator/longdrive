const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', verifyToken, authController.me);
router.put('/me', verifyToken, authController.update); // nowa trasa do aktualizacji profilu

module.exports = router;