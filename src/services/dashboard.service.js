const Transaction = require('../models/Transaction');

const getSummary = async () => {
  const result = await Transaction.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
      },
    },
  ]);

  const totals = { income: 0, expense: 0 };
  result.forEach(({ _id, total }) => {
    totals[_id] = total;
  });

  return {
    totalIncome: totals.income,
    totalExpenses: totals.expense,
    netBalance: totals.income - totals.expense,
  };
};

const getByCategory = async () => {
  return Transaction.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: { category: '$category', type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
    {
      $project: {
        _id: 0,
        category: '$_id.category',
        type: '$_id.type',
        total: 1,
        count: 1,
      },
    },
  ]);
};

const getMonthlySince = (range) => {
  const since = new Date();
  since.setMonth(since.getMonth() - (range - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);
  return since;
};

const getWeeklySince = (range) => {
  const since = new Date();
  const day = since.getDay(); // 0 (Sun) - 6 (Sat)
  const diffToMonday = day === 0 ? -6 : (1 - day);
  since.setDate(since.getDate() + diffToMonday - ((range - 1) * 7));
  since.setHours(0, 0, 0, 0);
  return since;
};

const getTrends = async ({ period = 'monthly', range = 12 } = {}) => {
  const isWeekly = period === 'weekly';
  const since = isWeekly ? getWeeklySince(range) : getMonthlySince(range);

  const groupId = isWeekly
    ? {
        year: { $isoWeekYear: '$date' },
        week: { $isoWeek: '$date' },
        type: '$type',
      }
    : {
        year: { $year: '$date' },
        month: { $month: '$date' },
        type: '$type',
      };

  const sortBy = isWeekly
    ? { '_id.year': 1, '_id.week': 1 }
    : { '_id.year': 1, '_id.month': 1 };

  const project = isWeekly
    ? {
        _id: 0,
        year: '$_id.year',
        week: '$_id.week',
        type: '$_id.type',
        total: 1,
      }
    : {
        _id: 0,
        year: '$_id.year',
        month: '$_id.month',
        type: '$_id.type',
        total: 1,
      };

  return Transaction.aggregate([
    { $match: { isDeleted: false, date: { $gte: since } } },
    {
      $group: {
        _id: groupId,
        total: { $sum: '$amount' },
      },
    },
    { $sort: sortBy },
    { $project: project },
  ]);
};

const getRecent = async (limit = 10) => {
  return Transaction.find()
    .populate('createdBy', 'name email')
    .sort({ date: -1 })
    .limit(limit);
};

module.exports = { getSummary, getByCategory, getTrends, getRecent };
