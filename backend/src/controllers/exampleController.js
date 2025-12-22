// Ví dụ cách viết một controller
exports.getAdminData = async (req, res) => {
  try {
    // Logic gọi Supabase ở đây...
    res.json({ message: "Đây là dữ liệu mật chỉ Admin mới thấy!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};