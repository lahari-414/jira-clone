const router = require('express').Router();
const commentController = require('../controllers/commentController');
const { authenticate } = require('../middleware/auth');
const { requireCommentMember } = require('../middleware/projectAccess');

router.use(authenticate);
router.use('/:id', requireCommentMember);

router.put('/:id', commentController.update);
router.delete('/:id', commentController.remove);

module.exports = router;
