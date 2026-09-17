const router = require('express').Router();
const savedFilterController = require('../controllers/savedFilterController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', savedFilterController.list);
router.post('/', savedFilterController.create);
router.delete('/:id', savedFilterController.remove);

module.exports = router;
