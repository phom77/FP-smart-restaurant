const Joi = require('joi');

// Regex: Tối thiểu 8 ký tự, 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const updateOrderStatusSchema = Joi.object({
    status: Joi.string()
        .valid('pending', 'processing', 'completed', 'cancelled')
        .required()
});

const registerSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Email không hợp lệ',
        'any.required': 'Email là bắt buộc'
    }),
    password: Joi.string().pattern(PASSWORD_REGEX).required().messages({
        'string.pattern.base': 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)',
        'any.required': 'Mật khẩu là bắt buộc'
    }),
    full_name: Joi.string().min(2).required(),
    phone: Joi.string().pattern(/^[0-9]{10,11}$/).optional().messages({
        'string.pattern.base': 'Số điện thoại không hợp lệ'
    }),
    restaurant_name: Joi.string().optional(),
    role: Joi.string().optional()
});

module.exports = {
    updateOrderStatusSchema,
    registerSchema, // Export thêm cái này
    PASSWORD_REGEX  // Export regex để dùng chỗ khác nếu cần
};