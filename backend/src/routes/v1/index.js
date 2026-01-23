const express = require('express');
const outboundRoutes = require('./outbound-route');

const router = express.Router();

router.use('/outbound', outboundRoutes);

module.exports = router;


