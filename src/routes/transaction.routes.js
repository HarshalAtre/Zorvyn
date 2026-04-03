const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { authorize, authorizeMin } = require('../middleware/authorize');
const validateObjectId = require('../middleware/validateObjectId');
const { list, getOne, create, update, remove } = require('../controllers/transaction.controller');

router.use(authenticate);

// Analysts and admins can read
router.get('/', authorizeMin('analyst'), list);
router.get('/:id', authorizeMin('analyst'), validateObjectId('id'), getOne);

// Only admins can write
router.post('/', authorize('admin'), create);
router.put('/:id', authorize('admin'), validateObjectId('id'), update);
router.delete('/:id', authorize('admin'), validateObjectId('id'), remove);

module.exports = router;
