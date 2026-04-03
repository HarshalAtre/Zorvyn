const Joi = require('joi');

const updateRole = Joi.object({
  role: Joi.string().valid('viewer', 'analyst', 'admin').required(),
});

const updateStatus = Joi.object({
  isActive: Joi.boolean().required(),
});

module.exports = { updateRole, updateStatus };
