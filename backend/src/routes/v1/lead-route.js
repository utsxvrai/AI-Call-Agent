const express = require('express');
const leadController = require('../../controllers/lead-controller');

const router = express.Router();

router.post('/batch', leadController.createBatch);
router.get('/batches', leadController.getBatches);
router.get('/', leadController.getLeads);
router.delete('/batch/:batchId', leadController.deleteBatch);

module.exports = router;
