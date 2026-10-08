const router = require('express').Router();
const sprintController = require('../controllers/sprintController');
const { authenticate } = require('../middleware/auth');
const { requireSprintMember, requireSprintManager } = require('../middleware/projectAccess');

router.use(authenticate);

router.get('/:id', requireSprintMember, sprintController.getById);
router.put('/:id', requireSprintManager, sprintController.update);
router.post('/:id/start', requireSprintManager, sprintController.start);
router.post('/:id/complete', requireSprintManager, sprintController.complete);
router.post('/:id/cancel', requireSprintManager, sprintController.cancel);

module.exports = router;
