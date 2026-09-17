const router = require('express').Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', authorize('ADMIN', 'PROJECT_MANAGER'), userController.list);
router.get('/:id', userController.getById);
router.post('/', authorize('ADMIN'), userController.create);
router.put('/:id', authorize('ADMIN'), userController.update);
router.patch('/:id/status', authorize('ADMIN'), userController.setStatus);
router.delete('/:id', authorize('ADMIN'), userController.remove);

module.exports = router;
