const express = require('express');
const router = express.Router();

const { CallController } = require("../../controllers");

router.post('/start', CallController.startCall);
router.post('/twiml', CallController.callTwiml);
router.post('/status', CallController.handleStatus);

module.exports = router;