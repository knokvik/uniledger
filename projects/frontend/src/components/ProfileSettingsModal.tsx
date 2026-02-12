import React, { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ProfileSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
}

const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ isOpen, onClose, user }) => {
    const [name, setName] = useState(user?.name || '');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(user?.avatar_url || null);
    const [uploading, setUploading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    if (!isOpen) return null;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'File size must be less than 5MB' });
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                setMessage({ type: 'error', text: 'Please select an image file' });
                return;
            }

            setSelectedFile(file);
            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadAvatar = async () => {
        if (!selectedFile) {
            setMessage({ type: 'error', text: 'Please select an image' });
            return;
        }

        setUploading(true);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.append('avatar', selectedFile);

            const response = await axios.post(
                `${API_URL}/api/profile/upload-avatar`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    withCredentials: true,
                }
            );

            if (response.data.success) {
                setMessage({ type: 'success', text: 'Avatar uploaded successfully!' });
                setSelectedFile(null);
                if (response.data.user?.avatar_url) {
                    setPreviewUrl(response.data.user.avatar_url);
                }
                // Refresh page after short delay to show new avatar
                setTimeout(() => window.location.reload(), 1500);
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to upload avatar'
            });
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProfile = async () => {
        setUpdating(true);
        setMessage(null);

        try {
            const response = await axios.put(
                `${API_URL}/api/profile`,
                { name },
                { withCredentials: true }
            );

            if (response.data.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                // Refresh after short delay
                setTimeout(() => window.location.reload(), 1500);
            }
        } catch (error: any) {
            console.error('Update error:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to update profile'
            });
        } finally {
            setUpdating(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-50"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div
                    className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <span className="text-2xl text-gray-500">×</span>
                        </button>
                    </div>

                    {/* Message */}
                    {message && (
                        <div
                            className={`mx-6 mt-4 p-4 rounded-lg ${message.type === 'success'
                                    ? 'bg-green-50 text-green-800 border border-green-200'
                                    : 'bg-red-50 text-red-800 border border-red-200'
                                }`}
                        >
                            {message.text}
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Avatar Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h3>
                            <div className="flex items-center gap-6">
                                {/* Avatar Preview */}
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white shadow-lg">
                                        {previewUrl ? (
                                            <img
                                                src={previewUrl}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-3xl font-bold text-white">
                                                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Upload Controls */}
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        id="avatar-upload-modal"
                                    />
                                    <label
                                        htmlFor="avatar-upload-modal"
                                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition font-medium text-sm"
                                    >
                                        Choose Image
                                    </label>
                                    {selectedFile && (
                                        <div className="mt-3">
                                            <p className="text-sm text-gray-600 mb-2">
                                                Selected: {selectedFile.name}
                                            </p>
                                            <button
                                                onClick={handleUploadAvatar}
                                                disabled={uploading}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
                                            >
                                                {uploading ? 'Uploading...' : 'Upload Avatar'}
                                            </button>
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-500 mt-2">
                                        Max 5MB. JPG, PNG, GIF supported
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-200"></div>

                        {/* Profile Info Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
                            <div className="space-y-4">
                                {/* Email (read-only) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                    />
                                </div>

                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter your name"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdateProfile}
                            disabled={updating}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
                        >
                            {updating ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProfileSettingsModal;
