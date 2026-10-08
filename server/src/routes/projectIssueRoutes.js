const router = require('express').Router({ mergeParams: true });
const issueController = require('../controllers/issueController');
const boardController = require('../controllers/boardController');
const sprintController = require('../controllers/sprintController');
const labelController = require('../controllers/labelController');
const { authenticate } = require('../middleware/auth');
const { requireProjectMember, requireProjectManager } = require('../middleware/projectAccess');
const validate = require('../middleware/validate');
const { createIssueRules } = require('../validators/issueValidators');
const { createSprintRules } = require('../validators/sprintValidators');
const incidentRoutes = require('./incidentRoutes');

// Mounted at /api/projects/:projectId/...
router.use(authenticate, requireProjectMember);

router.get('/issues', issueController.listByProject);
router.post('/issues', createIssueRules, validate, issueController.create);

router.get('/board', boardController.getBoard);
router.get('/backlog', boardController.getBacklog);
router.get('/sprint-board/:sprintId', boardController.getSprintBoard);

router.get('/sprints', sprintController.list);
router.get('/sprint-backlog', sprintController.backlog);
router.use('/incidents', incidentRoutes);
router.post('/sprints', requireProjectManager, createSprintRules, validate, sprintController.create);

router.get('/labels', labelController.list);
router.post('/labels', labelController.create);

module.exports = router;
