const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const categoryController = require('../controllers/categoryController');
const uploadController = require('../controllers/uploadController');
const staffController = require('../controllers/staffController');
const modifierController = require('../controllers/modifierController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Middleware chung cho tất cả admin routes
router.use(authMiddleware.verifyToken);
// Chỉ cho phép admin
router.use(roleMiddleware.authorizeRoles('admin'));

// --- MENU ITEMS ---
router.post('/menu-items', menuController.createMenuItem);
router.put('/menu-items/:id', menuController.updateMenuItem);
router.delete('/menu-items/:id', menuController.deleteMenuItem);

// --- CATEGORIES ---
router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// --- UPLOAD ---
router.post('/upload/image', uploadController.uploadMiddleware, uploadController.uploadImage);
router.post('/upload/images', uploadController.uploadMiddlewareArray, uploadController.uploadImages);

// --- STAFF MANAGEMENT ---
router.get('/staff', staffController.getStaff);
router.get('/staff/:id', staffController.getStaffById);
router.post('/staff', staffController.createStaff);
router.put('/staff/:id', staffController.updateStaff);
router.delete('/staff/:id', staffController.deleteStaff);

// --- MODIFIERS ---
router.get('/modifiers/groups', modifierController.getModifierGroups);
router.post('/modifiers/groups', modifierController.createModifierGroup);
router.put('/modifiers/groups/:id', modifierController.updateModifierGroup);
router.delete('/modifiers/groups/:id', modifierController.deleteModifierGroup);

router.post('/modifiers', modifierController.createModifier);
router.put('/modifiers/:id', modifierController.updateModifier);
router.delete('/modifiers/:id', modifierController.deleteModifier);

// --- MENU ITEM MODIFIERS ---
router.get('/menu-items/:menu_item_id/modifiers', modifierController.getMenuItemModifierGroups);
router.post('/menu-items/modifiers/link', modifierController.linkModifierGroup);
router.delete('/menu-items/:menu_item_id/modifiers/:modifier_group_id', modifierController.unlinkModifierGroup);

module.exports = router;
