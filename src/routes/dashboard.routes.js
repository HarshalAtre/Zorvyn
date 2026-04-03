const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { authorizeMin } = require('../middleware/authorize');
const { summary, byCategory, trends, recent } = require('../controllers/dashboard.controller');

router.use(authenticate);

// All authenticated users can see summary and recent
router.get('/summary', summary);
router.get('/recent', recent);

// Analyst and above for deeper analytics
router.get('/by-category', authorizeMin('analyst'), byCategory);
router.get('/trends', authorizeMin('analyst'), trends);

module.exports = router;
