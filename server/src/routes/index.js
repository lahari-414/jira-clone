const router = require('express').Router();

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/projects', require('./projectRoutes'));
router.use('/projects/:projectId', require('./projectIssueRoutes'));
router.use('/issues', require('./issueRoutes'));
router.use('/comments', require('./commentRoutes'));
router.use('/sprints', require('./sprintRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/search', require('./searchRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/saved-filters', require('./savedFilterRoutes'));
router.use('/admin', require('./adminRoutes'));

module.exports = router;
