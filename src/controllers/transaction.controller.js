const txService = require('../services/transaction.service');
const { create: createSchema, update: updateSchema } = require('../validators/transaction.validator');

const isPositiveInteger = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

const list = async (req, res, next) => {
  try {
    const { page, limit, type, category, startDate, endDate, search } = req.query;

    if (page !== undefined && !isPositiveInteger(page)) {
      return res.status(400).json({ success: false, message: 'Query param "page" must be a positive integer' });
    }
    if (limit !== undefined && !isPositiveInteger(limit)) {
      return res.status(400).json({ success: false, message: 'Query param "limit" must be a positive integer' });
    }
    if (type !== undefined && !['income', 'expense'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Query param "type" must be "income" or "expense"' });
    }
    if (startDate !== undefined && Number.isNaN(Date.parse(startDate))) {
      return res.status(400).json({ success: false, message: 'Query param "startDate" must be a valid ISO date' });
    }
    if (endDate !== undefined && Number.isNaN(Date.parse(endDate))) {
      return res.status(400).json({ success: false, message: 'Query param "endDate" must be a valid ISO date' });
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ success: false, message: '"startDate" cannot be after "endDate"' });
    }

    const result = await txService.list({ page, limit, type, category, startDate, endDate, search });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const tx = await txService.getById(req.params.id);
    res.json({ success: true, data: { transaction: tx } });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const tx = await txService.create(value, req.user._id);
    res.status(201).json({ success: true, data: { transaction: tx } });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { error, value } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const tx = await txService.update(req.params.id, value);
    res.json({ success: true, data: { transaction: tx } });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await txService.softDelete(req.params.id);
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getOne, create, update, remove };
