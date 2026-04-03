const Transaction = require('../models/Transaction');

const buildFilter = ({ type, category, startDate, endDate, search }) => {
  const filter = {};
  if (type) filter.type = type;
  if (category) filter.category = new RegExp(category, 'i');
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  if (search) {
    filter.$or = [
      { notes: new RegExp(search, 'i') },
      { category: new RegExp(search, 'i') },
    ];
  }
  return filter;
};

const list = async ({ page = 1, limit = 20, ...filters }) => {
  const skip = (page - 1) * limit;
  const filter = buildFilter(filters);

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate('createdBy', 'name email')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Transaction.countDocuments(filter),
  ]);

  return { transactions, total, page: Number(page), limit: Number(limit) };
};

const getById = async (id) => {
  const tx = await Transaction.findById(id).populate('createdBy', 'name email');
  if (!tx) {
    const err = new Error('Transaction not found');
    err.statusCode = 404;
    throw err;
  }
  return tx;
};

const create = async (data, userId) => {
  return Transaction.create({ ...data, createdBy: userId });
};

const update = async (id, data) => {
  const tx = await Transaction.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!tx) {
    const err = new Error('Transaction not found');
    err.statusCode = 404;
    throw err;
  }
  return tx;
};

const softDelete = async (id) => {
  const tx = await Transaction.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );
  if (!tx) {
    const err = new Error('Transaction not found');
    err.statusCode = 404;
    throw err;
  }
  return tx;
};

module.exports = { list, getById, create, update, softDelete };
