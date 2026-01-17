const supabase = require('../config/supabaseClient');
const multer = require('multer');
const path = require('path');

// Sử dụng Memory Storage để giữ file trong RAM, sau đó upload thẳng lên Supabase
const storage = multer.memoryStorage();

// File filter (chỉ nhận ảnh)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// Export middleware
exports.uploadMiddleware = upload.single('image');
exports.uploadMiddlewareArray = upload.array('images'); // No limit

// Helper function to upload a single file
const uploadFileToSupabase = async (file) => {
    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
    const filePath = `${fileName}`;

    const { error } = await supabase
        .storage
        .from('menu_images')
        .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false
        });

    if (error) throw error;

    const { data } = supabase
        .storage
        .from('menu_images')
        .getPublicUrl(filePath);

    return data.publicUrl;
};

// Controller upload lên Supabase (Single)
exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const publicUrl = await uploadFileToSupabase(req.file);

        res.status(200).json({
            success: true,
            data: {
                url: publicUrl
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message || 'Upload failed' });
    }
};

// Controller upload multiple files
exports.uploadImages = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, error: 'No files uploaded' });
        }

        const uploadPromises = req.files.map(file => uploadFileToSupabase(file));
        const urls = await Promise.all(uploadPromises);

        res.status(200).json({
            success: true,
            data: {
                urls: urls
            }
        });
    } catch (err) {
        console.error("Multiple Upload Error:", err);
        res.status(500).json({ success: false, error: err.message || 'Upload failed' });
    }
};
