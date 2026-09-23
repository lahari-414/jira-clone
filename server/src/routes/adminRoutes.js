const router = require('express').Router();
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('ADMIN', 'HR'));

router.get('/stats', adminController.stats);
router.get('/audit-logs', adminController.auditLog);
router.get('/users', userController.list);

module.exports = router;
