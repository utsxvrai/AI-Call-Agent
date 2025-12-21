const express = require('express');
const callRoutes = require('./call-route');

const router = express.Router();

router.use('/call', callRoutes);

module.exports = router;


