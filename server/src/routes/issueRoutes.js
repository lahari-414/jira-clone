const router = require('express').Router();
const issueController = require('../controllers/issueController');
const commentController = require('../controllers/commentController');
const labelController = require('../controllers/labelController');
const { authenticate } = require('../middleware/auth');
const { requireIssueMember, requireIssueManager, requireIssueAssigneeOrManager } = require('../middleware/projectAccess');
const attachmentController = require('../controllers/attachmentController');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const { changeStatusRules } = require('../validators/issueValidators');

// Standalone /api/issues/:id routes (project-nested creation lives in projectIssueRoutes.js)
router.use(authenticate);
router.use('/:id', requireIssueMember);
router.use('/:issueId', requireIssueMember);

router.get('/:id', issueController.getById);
router.put('/:id', issueController.update);
router.delete('/:id', requireIssueManager, issueController.remove);
router.patch('/:id/status', requireIssueAssigneeOrManager, changeStatusRules, validate, issueController.changeStatus);
router.patch('/:id/assignee', issueController.changeAssignee);
router.patch('/:id/priority', issueController.changePriority);
router.get('/:id/activity', issueController.getActivity);

router.get('/:issueId/comments', commentController.list);
router.post('/:issueId/comments', commentController.create);
router.get('/:issueId/attachments', attachmentController.list);
router.post('/:issueId/attachments', upload.single('file'), attachmentController.create);
router.delete('/:issueId/attachments/:attachmentId', attachmentController.remove);
router.post('/:issueId/labels', labelController.attach);
router.delete('/:issueId/labels/:labelId', labelController.detach);

module.exports = router;
