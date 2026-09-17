const router = require('express').Router();
const projectController = require('../controllers/projectController');
const { authenticate } = require('../middleware/auth');
const { requireProjectMember, requireProjectManager } = require('../middleware/projectAccess');
const validate = require('../middleware/validate');
const { createProjectRules } = require('../validators/projectValidators');

router.use(authenticate);

router.get('/', projectController.list);
router.post('/', createProjectRules, validate, projectController.create);

router.get('/:id', (req, res, next) => { req.params.projectId = req.params.id; next(); }, requireProjectMember, projectController.getById);
router.put('/:id', (req, res, next) => { req.params.projectId = req.params.id; next(); }, requireProjectMember, requireProjectManager, projectController.update);
router.delete('/:id', (req, res, next) => { req.params.projectId = req.params.id; next(); }, requireProjectMember, requireProjectManager, projectController.remove);
router.patch('/:id/archive', (req, res, next) => { req.params.projectId = req.params.id; next(); }, requireProjectMember, requireProjectManager, projectController.archive);

router.get('/:id/members', (req, res, next) => { req.params.projectId = req.params.id; next(); }, requireProjectMember, projectController.listMembers);
router.post('/:id/members', (req, res, next) => { req.params.projectId = req.params.id; next(); }, requireProjectMember, requireProjectManager, projectController.addMember);
router.patch('/:id/members/:userId', (req, res, next) => { req.params.projectId = req.params.id; next(); }, requireProjectMember, requireProjectManager, projectController.updateMember);
router.delete('/:id/members/:userId', (req, res, next) => { req.params.projectId = req.params.id; next(); }, requireProjectMember, requireProjectManager, projectController.removeMember);

module.exports = router;
