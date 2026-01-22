const express = require('express');
const callRoutes = require('./call-route');
const leadRoutes = require('./lead-route');

const router = express.Router();

router.use('/call', callRoutes);
router.use('/leads', leadRoutes);

module.exports = router;


