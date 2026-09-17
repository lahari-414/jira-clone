const router = require('express').Router();
const sprintController = require('../controllers/sprintController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/:id', sprintController.getById);
router.put('/:id', sprintController.update);
router.post('/:id/start', sprintController.start);
router.post('/:id/complete', sprintController.complete);
router.post('/:id/cancel', sprintController.cancel);

module.exports = router;
