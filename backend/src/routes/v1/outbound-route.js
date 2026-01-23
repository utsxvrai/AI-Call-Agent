const express = require('express');
const router = express.Router();
const { OutboundController } = require('../../controllers');

router.post('/outgoing-call', OutboundController.initiateCall);
router.all('/outgoing-call-twiml', OutboundController.generateTwiML);
router.post('/hangup-call', OutboundController.hangupCall);

module.exports = router;
