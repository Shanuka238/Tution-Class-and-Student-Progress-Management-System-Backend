const express = require('express');
const router = express.Router();
const { healthCheck } = require('../controllers/healthcontroller');

router.get('/', healthCheck);

module.exports = router;