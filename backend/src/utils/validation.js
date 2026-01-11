const Joi = require('joi');

const updateOrderStatusSchema = Joi.object({
    status: Joi.string()
        .valid('pending', 'processing', 'completed', 'cancelled')
        .required()
        .messages({
            'any.only': 'Status must be one of: pending, processing, completed, cancelled',
            'any.required': 'Status is required'
        })
});

module.exports = {
    updateOrderStatusSchema
};
