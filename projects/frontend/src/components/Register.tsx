import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAppSelector } from "../store/hooks";

const Register: React.FC = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    const { register, isRegisterLoading, registerError } = useAuth();
    const { isAuthenticated } = useAppSelector((state) => state.auth);
    const navigate = useNavigate();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validation
        if (!email || !password || !confirmPassword) {
            setError("Please fill in all required fields");
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setError("Please enter a valid email address");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        register({ email, password, name: name || undefined });
    };

    // Display error from mutation
    useEffect(() => {
        if (registerError) {
            const err = registerError as any;
            setError(err?.response?.data?.message || "Registration failed. Please try again.");
        }
    }, [registerError]);

    return (
        <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 overflow-hidden">
            {/* Main Container */}
            <div className="w-full max-w-md">
                {/* Logo and Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg mb-3">
                        <span className="text-2xl">🔐</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                        Create Account
                    </h1>
                    <p className="text-sm text-gray-600">
                        Join UniLedger to manage your treasury
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6">
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs flex items-start gap-2">
                                <span className="text-base">⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Name Field */}
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-xs font-semibold text-gray-700 mb-1.5"
                            >
                                Full Name <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">
                                    👤
                                </span>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your full name"
                                    className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-900 placeholder:text-gray-400"
                                    disabled={isRegisterLoading}
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-xs font-semibold text-gray-700 mb-1.5"
                            >
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">
                                    ✉️
                                </span>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-900 placeholder:text-gray-400"
                                    disabled={isRegisterLoading}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-xs font-semibold text-gray-700 mb-1.5"
                            >
                                Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">
                                    🔒
                                </span>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Create a strong password"
                                    className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-900 placeholder:text-gray-400"
                                    disabled={isRegisterLoading}
                                    required
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Must be at least 6 characters
                            </p>
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block text-xs font-semibold text-gray-700 mb-1.5"
                            >
                                Confirm Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">
                                    🔑
                                </span>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter your password"
                                    className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-900 placeholder:text-gray-400"
                                    disabled={isRegisterLoading}
                                    required
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isRegisterLoading}
                            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isRegisterLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Creating Account...</span>
                                </>
                            ) : (
                                <>
                                    <span>Create Account</span>
                                    <span>→</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Login Link */}
                <p className="mt-4 text-center text-xs text-gray-600">
                    Already have an account?{' '}
                    <Link
                        to="/login"
                        className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition"
                    >
                        Sign in here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
