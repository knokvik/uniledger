import express from 'express';
import { supabase } from '../config/supabase.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    next();
};

/**
 * @route   POST /api/profile/upload-avatar
 * @desc    Upload user avatar to Supabase Storage
 * @access  Private
 */
router.post('/upload-avatar', requireAuth, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const userId = req.session.userId;
        const file = req.file;

        // Generate unique filename
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('profiles')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if (uploadError) {
            console.error('Supabase Storage upload error:', uploadError);
            return res.status(500).json({
                success: false,
                message: 'Failed to upload image to storage',
                error: uploadError.message
            });
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('profiles')
            .getPublicUrl(filePath);

        const avatarUrl = urlData.publicUrl;

        // Update user's avatar_url in database
        const { data: userData, error: updateError } = await supabase
            .from('users')
            .update({
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select('id, email, name, avatar_url')
            .single();

        if (updateError) {
            console.error('Database update error:', updateError);
            return res.status(500).json({
                success: false,
                message: 'Failed to update user profile',
                error: updateError.message
            });
        }

        res.json({
            success: true,
            message: 'Avatar uploaded successfully',
            user: userData
        });

    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during upload',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/profile
 * @desc    Update user profile (name, etc.)
 * @access  Private
 */
router.put('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { name } = req.body;

        const updateData = {
            updated_at: new Date().toISOString()
        };

        if (name !== undefined) {
            updateData.name = name;
        }

        const { data: userData, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId)
            .select('id, email, name, avatar_url')
            .single();

        if (error) {
            console.error('Profile update error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update profile',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: userData
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;

        const { data: userData, error } = await supabase
            .from('users')
            .select('id, email, name, avatar_url, created_at')
            .eq('id', userId)
            .single();

        if (error || !userData) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: userData
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

export default router;
