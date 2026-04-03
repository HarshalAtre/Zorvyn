const dashboardService = require('../services/dashboard.service');

const summary = async (req, res, next) => {
  try {
    const data = await dashboardService.getSummary();
    res.json({ success: true, data: { summary: data } });
  } catch (err) {
    next(err);
  }
};

const byCategory = async (req, res, next) => {
  try {
    const data = await dashboardService.getByCategory();
    res.json({ success: true, data: { categories: data } });
  } catch (err) {
    next(err);
  }
};

const trends = async (req, res, next) => {
  try {
    const period = req.query.period || 'monthly';
    const rawRange = req.query.range;

    if (!['monthly', 'weekly'].includes(period)) {
      return res.status(400).json({
        success: false,
        message: 'Query param "period" must be "monthly" or "weekly"',
      });
    }

    if (rawRange !== undefined) {
      const parsed = Number(rawRange);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Query param "range" must be a positive integer',
        });
      }
    }

    const range = rawRange ? Number(rawRange) : 12;
    const data = await dashboardService.getTrends({ period, range });
    res.json({ success: true, data: { period, range, trends: data } });
  } catch (err) {
    next(err);
  }
};

const recent = async (req, res, next) => {
  try {
    const { limit: rawLimit } = req.query;
    if (rawLimit !== undefined) {
      const parsed = Number(rawLimit);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Query param "limit" must be a positive integer',
        });
      }
    }

    const limit = parseInt(rawLimit, 10) || 10;
    const data = await dashboardService.getRecent(limit);
    res.json({ success: true, data: { transactions: data } });
  } catch (err) {
    next(err);
  }
};

module.exports = { summary, byCategory, trends, recent };
