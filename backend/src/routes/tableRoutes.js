const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// 1. Get all tables (with filters) - Admin/Staff/Customer
router.get('/',
  verifyToken,
  authorizeRoles('admin', 'waiter', 'customer'),
  tableController.getTables
);

// 2. Get single table details - Admin
router.get('/:id',
  verifyToken,
  authorizeRoles('admin'),
  tableController.getTableById
);

// 3. Create new table - Admin
router.post('/',
  verifyToken,
  authorizeRoles('admin'),
  tableController.createTable
);

// 4. Update table - Admin
router.put('/:id',
  verifyToken,
  authorizeRoles('admin'),
  tableController.updateTable
);

// 5. Update table status - Staff/Admin
router.patch('/:id/status',
  verifyToken,
  authorizeRoles('admin', 'waiter'),
  tableController.updateTableStatus
);

// 6. Delete table - Admin
router.delete('/:id',
  verifyToken,
  authorizeRoles('admin'),
  tableController.deleteTable
);

// 7. QR Operations
// IMPORTANT: Bulk operations must come BEFORE parameterized routes to avoid route conflicts

// Bulk Regenerate All QR codes
router.post('/qr/regenerate-all',
  verifyToken,
  authorizeRoles('admin'),
  tableController.regenerateAllQR
);

// Download all QR codes (ZIP)
router.get('/qr/download-all',
  verifyToken,
  authorizeRoles('admin'),
  tableController.downloadAllQR
);

// Download all QR codes (Single PDF)
router.get('/qr/download-all-pdf',
  verifyToken,
  authorizeRoles('admin'),
  tableController.downloadBulkPDF
);

// Generate/Regenerate single QR code
router.post('/:id/qr/generate',
  verifyToken,
  authorizeRoles('admin'),
  tableController.regenerateQRToken
);

// Download single QR code (PNG/PDF)
router.get('/:id/qr/download',
  verifyToken,
  authorizeRoles('admin'),
  (req, res) => {
    if (req.query.format === 'png') return tableController.downloadTablePNG(req, res);
    return tableController.downloadTablePDF(req, res);
  }
);

// Preview single QR (Show in admin panel)
router.get('/:id/qr',
  verifyToken,
  authorizeRoles('admin'),
  tableController.generateQRCode
);

module.exports = router;