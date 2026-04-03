const Joi = require('joi');

const create = Joi.object({
  amount: Joi.number().positive().required(),
  type: Joi.string().valid('income', 'expense').required(),
  category: Joi.string().trim().min(1).max(100).required(),
  date: Joi.date().iso().default(() => new Date()),
  notes: Joi.string().trim().max(500).allow('').default(''),
});

const update = Joi.object({
  amount: Joi.number().positive(),
  type: Joi.string().valid('income', 'expense'),
  category: Joi.string().trim().min(1).max(100),
  date: Joi.date().iso(),
  notes: Joi.string().trim().max(500).allow(''),
}).min(1); // at least one field required for update

module.exports = { create, update };
