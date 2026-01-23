const express = require('express');
const outboundRoutes = require('./outbound-route');
const leadRoutes = require('./lead-route');

const router = express.Router();

router.use('/outbound', outboundRoutes);
router.use('/leads', leadRoutes);

module.exports = router;


