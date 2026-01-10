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

// Controller upload lên Supabase
exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const file = req.file;
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const filePath = `${fileName}`;

        // Upload to Supabase Storage (Bucket: 'menu_images')
        const { data, error } = await supabase
            .storage
            .from('menu_images')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (error) {
            console.error("Supabase Upload Error:", error);
            throw error;
        }

        // Get Public URL
        const { data: publicURLData } = supabase
            .storage
            .from('menu_images')
            .getPublicUrl(filePath);

        res.status(200).json({
            success: true,
            data: {
                url: publicURLData.publicUrl
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message || 'Upload failed' });
    }
};
