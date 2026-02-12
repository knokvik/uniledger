import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState(user?.name || '');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(user?.avatar_url || null);
    const [uploading, setUploading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
                // Update preview with the new URL from server
                if (response.data.user?.avatar_url) {
                    setPreviewUrl(response.data.user.avatar_url);
                }
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            ← Back
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                    </div>
                    <button
                        onClick={() => logout()}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-3xl mx-auto px-6 py-12">
                {/* Message */}
                {message && (
                    <div
                        className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                            }`}
                    >
                        {message.text}
                    </div>
                )}

                {/* Profile Card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {/* Avatar Section */}
                    <div className="p-8 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Picture</h2>
                        <div className="flex items-center gap-6">
                            {/* Avatar Preview */}
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white shadow-lg">
                                    {previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-4xl font-bold text-white">
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
                                    id="avatar-upload"
                                />
                                <label
                                    htmlFor="avatar-upload"
                                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition font-medium"
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
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                                        >
                                            {uploading ? 'Uploading...' : 'Upload Avatar'}
                                        </button>
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 mt-2">
                                    Max file size: 5MB. Supported formats: JPG, PNG, GIF
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Profile Info Section */}
                    <div className="p-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
                        <div className="space-y-6">
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

                            {/* Update Button */}
                            <button
                                onClick={handleUpdateProfile}
                                disabled={updating}
                                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
                            >
                                {updating ? 'Updating...' : 'Update Profile'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
