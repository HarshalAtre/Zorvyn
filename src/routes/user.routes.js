const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const validateObjectId = require('../middleware/validateObjectId');
const { listUsers, getUser, updateRole, updateStatus } = require('../controllers/user.controller');

// All user management is admin-only
router.use(authenticate, authorize('admin'));

router.get('/', listUsers);
router.get('/:id', validateObjectId('id'), getUser);
router.patch('/:id/role', validateObjectId('id'), updateRole);
router.patch('/:id/status', validateObjectId('id'), updateStatus);

module.exports = router;
