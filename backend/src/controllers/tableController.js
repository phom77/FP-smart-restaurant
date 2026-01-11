const supabase = require('../config/supabaseClient');
const QRCode = require('qrcode');

// 1. Lấy danh sách bàn
exports.getTables = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('table_number', { ascending: true });

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Tạo bàn mới (Admin)
exports.createTable = async (req, res) => {
  try {
    const { table_number, capacity } = req.body;

    // Kiểm tra trùng số bàn
    const { data: existing } = await supabase
      .from('tables')
      .select('id')
      .eq('table_number', table_number)
      .single();

    if (existing) {
      return res.status(400).json({ success: false, message: `Bàn số ${table_number} đã tồn tại` });
    }

    // Insert (Supabase tự sinh id và qr_code_token nhờ default value)
    const { data, error } = await supabase
      .from('tables')
      .insert([{ table_number, capacity, status: 'available' }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
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

    // Tạo URL mà khách hàng sẽ truy cập
    // Ví dụ: http://localhost:5173/menu?table_token=...
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const scanUrl = `${frontendUrl}/menu?table_token=${table.qr_code_token}`;

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