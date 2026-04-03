const userService = require('../services/user.service');
const { updateRole: roleSchema, updateStatus: statusSchema } = require('../validators/user.validator');

const listUsers = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await userService.listUsers({ page, limit });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await userService.getUser(req.params.id);
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const { error, value } = roleSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const isSelf = String(req.user._id) === req.params.id;
    if (isSelf && value.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role from admin',
      });
    }

    const user = await userService.updateRole(req.params.id, value.role);
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { error, value } = statusSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const isSelf = String(req.user._id) === req.params.id;
    if (isSelf && value.isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account',
      });
    }

    const user = await userService.updateStatus(req.params.id, value.isActive);
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

module.exports = { listUsers, getUser, updateRole, updateStatus };
