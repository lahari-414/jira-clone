const router = require('express').Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', authorize('ADMIN', 'HR', 'PROJECT_MANAGER'), userController.list);
router.get('/:id', userController.getById);
router.post('/', authorize('ADMIN', 'HR'), userController.create);
router.put('/:id', authorize('ADMIN', 'HR'), userController.update);
router.patch('/:id/status', authorize('ADMIN', 'HR'), userController.setStatus);
router.patch('/:id/restore', authorize('ADMIN', 'HR'), userController.restore);
router.delete('/:id', authorize('ADMIN', 'HR'), userController.remove);

module.exports = router;
