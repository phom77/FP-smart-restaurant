const supabase = require('../config/supabaseClient');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const jwt = require('jsonwebtoken');
const archiver = require('archiver');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret';

// Helper: Generate signed JWT for table
const generateTableJWT = (tableId) => {
  return jwt.sign(
    {
      table_id: tableId,
      restaurant_id: 'default_res', // Future multi-tenant
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: '90d' }
  );
};

// 1. Lấy danh sách bàn
exports.getTables = async (req, res) => {
  try {
    console.log('[DEBUG] GET /api/admin/tables hit with query:', req.query);
    const {
      location,
      is_active,
      sort_by = 'table_number',
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('tables')
      .select('*', { count: 'exact' })
      .is('deleted_at', null);

    if (location) query = query.eq('location', location);
    if (is_active !== undefined) query = query.eq('is_active', is_active === 'true');

    // Sorting logic
    if (sort_by === 'capacity') {
      query = query.order('capacity', { ascending: false });
    } else if (sort_by === 'created_at') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('table_number', { ascending: true });
    }

    // Apply pagination
    query = query.range(offset, offset + limitNum - 1);

    const { data, error, count } = await query;

    if (error) throw error;
    res.status(200).json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages: Math.ceil(count / limitNum)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 1.1 Lấy chi tiết 1 bàn
exports.getTableById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Bàn không tồn tại' });
    }

    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Tạo bàn mới (Admin)
exports.createTable = async (req, res) => {
  try {
    const { table_number, capacity, location, description } = req.body;

    // Validate capacity (1-20)
    if (capacity < 1 || capacity > 20) {
      return res.status(400).json({ success: false, message: 'Capacity must be between 1 and 20' });
    }

    const { data: existing } = await supabase
      .from('tables')
      .select('id')
      .eq('table_number', table_number)
      .single();

    if (existing) {
      return res.status(400).json({ success: false, message: `Table number ${table_number} already exists` });
    }

    // Insert with initial status
    const { data: table, error } = await supabase
      .from('tables')
      .insert([{
        table_number,
        capacity,
        location,
        description,
        status: 'available',
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;

    // Generate signed JWT token
    const signedToken = generateTableJWT(table.id);

    // Update table with the signed token
    const { data: finalTable, error: updateError } = await supabase
      .from('tables')
      .update({
        qr_code_token: signedToken,
        token_created_at: new Date().toISOString()
      })
      .eq('id', table.id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(201).json({ success: true, data: finalTable });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Sinh ảnh QR Code cho bàn
exports.generateQRCode = async (req, res) => {
  try {
    const { id } = req.params;

    // Lấy thông tin bàn để có token
    const { data: table, error } = await supabase
      .from('tables')
      .select('table_number, qr_code_token')
      .eq('id', id)
      .single();

    if (error || !table) {
      return res.status(404).json({ success: false, message: 'Bàn không tồn tại' });
    }

    // URL for customer scanning
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const scanUrl = `${frontendUrl}/menu?table=${id}&token=${table.qr_code_token}`;

    // Tạo ảnh QR dạng Base64 (Data URL)
    const qrImage = await QRCode.toDataURL(scanUrl);

    res.status(200).json({
      success: true,
      table_number: table.table_number,
      qr_code_url: scanUrl,
      qr_image: qrImage
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Làm mới QR Token (Admin)
exports.regenerateQRToken = async (req, res) => {
  try {
    const { id } = req.params;

    // Safety Check: Don't regenerate if table is occupied
    const { data: tableCheck, error: checkError } = await supabase
      .from('tables')
      .select('status, table_number')
      .eq('id', id)
      .single();

    if (checkError || !tableCheck) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    if (tableCheck.status === 'occupied') {
      return res.status(400).json({
        success: false,
        message: `Cannot regenerate QR for Table ${tableCheck.table_number} while it is occupied.`
      });
    }

    const signedToken = generateTableJWT(id);

    const { data, error } = await supabase
      .from('tables')
      .update({
        qr_code_token: signedToken,
        token_created_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({ success: true, message: 'QR Code regenerated successfully', data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4.1 Làm mới TOÀN BỘ QR Token (Admin)
exports.regenerateAllQR = async (req, res) => {
  try {
    // Để làm mới tất cả các token khác nhau, ta cần fetch ra rồi update từng dòng hoặc dùng RPC nếu database logic phức tạp.
    // Ở đây ta đơn giản là lấy toàn bộ danh sách ID rồi update.
    const { data: tables, error: fetchError } = await supabase.from('tables').select('id, table_number');
    if (fetchError) throw fetchError;

    const updates = tables.map(t => ({
      id: t.id,
      qr_code_token: generateTableJWT(t.id),
      token_created_at: new Date().toISOString()
    }));

    // Sử dụng upsert để cập nhật hàng loạt dựa trên primary key 'id'
    const { error: updateError } = await supabase
      .from('tables')
      .upsert(updates);

    if (updateError) throw updateError;

    res.status(200).json({
      success: true,
      message: `${updates.length} table QR codes regenerated successfully`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Xuất file PDF chứa QR Code (Admin) - Redesigned for High-End Look
exports.downloadTablePDF = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: table, error } = await supabase
      .from('tables')
      .select('table_number, qr_code_token')
      .eq('id', id)
      .single();

    if (error || !table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const scanUrl = `${frontendUrl}/menu?table=${id}&token=${table.qr_code_token}`;
    const qrImage = await QRCode.toDataURL(scanUrl, { margin: 2, scale: 10 });

    const doc = new PDFDocument({
      size: 'A5',
      margin: 0 // Using absolute positioning
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Table_${table.table_number}_QR.pdf`);

    doc.pipe(res);

    // Background base
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffffff');

    // Branding Header
    doc.fillColor('#6366f1').fontSize(24).font('Helvetica-Bold').text('SMART RESTAURANT', 0, 60, { align: 'center' });
    doc.fillColor('#94a3b8').fontSize(9).font('Helvetica').text('CONTACTLESS ORDERING SYSTEM', 0, 90, { align: 'center', characterSpacing: 1.5 });

    // Decorative Line
    doc.strokeColor('#f1f5f9').lineWidth(1).moveTo(100, 115).lineTo(doc.page.width - 100, 115).stroke();

    // Table Badge Section
    doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold').text('TABLE', 0, 140, { align: 'center' });
    doc.fillColor('#6366f1').fontSize(64).font('Helvetica-Bold').text(`${table.table_number}`, 0, 155, { align: 'center' });

    // QR Code Positioned Safely
    const imgData = qrImage.replace(/^data:image\/png;base64,/, "");
    const imgBuffer = Buffer.from(imgData, 'base64');
    const qrSize = 220;
    const qrX = (doc.page.width - qrSize) / 2;
    const qrY = 240;

    // Draw QR
    doc.image(imgBuffer, qrX, qrY, { width: qrSize });

    // Instruction Section
    const instructionY = qrY + qrSize + 30;
    doc.fillColor('#1e293b').fontSize(16).font('Helvetica-Bold').text('SCAN TO ORDER', 0, instructionY, { align: 'center' });

    doc.fillColor('#64748b').fontSize(10).font('Helvetica').text('1. Open Camera  |  2. Scan QR  |  3. Enjoy', 0, instructionY + 25, { align: 'center' });

    // Global Reset / Finished
    doc.end();

  } catch (err) {
    console.error("PDF Download Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5.1 Tải file PNG QR (Admin)
exports.downloadTablePNG = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: table, error } = await supabase
      .from('tables')
      .select('table_number, id, qr_code_token')
      .eq('id', id)
      .single();

    if (error || !table) return res.status(404).json({ success: false, message: 'Table not found' });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const scanUrl = `${frontendUrl}/menu?table=${table.id}&token=${table.qr_code_token}`;

    const qrBuffer = await QRCode.toBuffer(scanUrl, {
      margin: 1,
      scale: 20
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename=Table_${table.table_number}_QR.png`);
    res.send(qrBuffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5.2 Tải toàn bộ QR (ZIP)
exports.downloadAllQR = async (req, res) => {
  try {
    const { data: tables, error } = await supabase.from('tables').select('id, table_number, qr_code_token');
    if (error) throw error;

    const archive = archiver('zip', { zlib: { level: 9 } });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=All_Table_QRs.zip');

    archive.pipe(res);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    for (const table of tables) {
      const scanUrl = `${frontendUrl}/menu?table=${table.id}&token=${table.qr_code_token}`;
      const qrBuffer = await QRCode.toBuffer(scanUrl, { margin: 1, scale: 10 });
      archive.append(qrBuffer, { name: `Table_${table.table_number}.png` });
    }

    archive.finalize();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5.3 Tải file PDF tổng hợp (Bulk Print PDF)
exports.downloadBulkPDF = async (req, res) => {
  try {
    const { data: tables, error } = await supabase.from('tables').select('id, table_number, qr_code_token').order('table_number', { ascending: true });
    if (error) throw error;

    const doc = new PDFDocument({
      size: 'A5',
      margin: 0 // Using absolute positioning
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=All_Tables_Bulk_Print.pdf');
    doc.pipe(res);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      if (i > 0) doc.addPage();

      const scanUrl = `${frontendUrl}/menu?table=${table.id}&token=${table.qr_code_token}`;
      const qrDataUrl = await QRCode.toDataURL(scanUrl, { margin: 2, scale: 10 });

      // Redesigned Layout (Synced with single PDF)
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffffff');

      // Branding Header
      doc.fillColor('#6366f1').fontSize(24).font('Helvetica-Bold').text('SMART RESTAURANT', 0, 60, { align: 'center' });
      doc.fillColor('#94a3b8').fontSize(9).font('Helvetica').text('CONTACTLESS ORDERING SYSTEM', 0, 90, { align: 'center', characterSpacing: 1.5 });

      // Decorative Line
      doc.strokeColor('#f1f5f9').lineWidth(1).moveTo(100, 115).lineTo(doc.page.width - 100, 115).stroke();

      // Table Badge Section
      doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold').text('TABLE', 0, 140, { align: 'center' });
      doc.fillColor('#6366f1').fontSize(64).font('Helvetica-Bold').text(`${table.table_number}`, 0, 155, { align: 'center' });

      // QR Code Positioned Safely
      const imgData = qrDataUrl.replace(/^data:image\/png;base64,/, "");
      const imgBuffer = Buffer.from(imgData, 'base64');
      const qrSize = 220;
      const qrX = (doc.page.width - qrSize) / 2;
      const qrY = 240;

      doc.image(imgBuffer, qrX, qrY, { width: qrSize });

      // Instruction Section
      const instructionY = qrY + qrSize + 30;
      doc.fillColor('#1e293b').fontSize(16).font('Helvetica-Bold').text('SCAN TO ORDER', 0, instructionY, { align: 'center' });
      doc.fillColor('#64748b').fontSize(10).font('Helvetica').text('1. Open Camera  |  2. Scan QR  |  3. Enjoy', 0, instructionY + 25, { align: 'center' });
    }

    doc.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 6. Cập nhật thông tin bàn (Admin)
exports.updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { table_number, capacity, status, location, description, is_active } = req.body;

    const { data, error } = await supabase
      .from('tables')
      .update({ table_number, capacity, status, location, description, is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 7. Xóa bàn (Admin)
exports.deleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('tables')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false
      })
      .eq('id', id);

    if (error) throw error;
    res.status(200).json({ success: true, message: 'Table deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 8. Cập nhật trạng thái bàn (Staff/Admin)
exports.updateTableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['available', 'occupied', 'reserved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const { data, error } = await supabase
      .from('tables')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};