import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        if (name.trim().length < 2) {
            setError('Please enter your full name.');
            return;
        }

        setLoading(true);

        try {
            await register(email, password, name.trim());
            navigate('/dashboard');
        } catch (err) {
            console.error('Registration error:', err);
            if (err.code === 'auth/email-already-in-use') {
                setError('An account with this email already exists.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Invalid email address.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password is too weak. Please use a stronger password.');
            } else {
                setError('Failed to create account. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 
                  bg-gradient-to-br from-medical-dark via-medical-blue to-medical-teal">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-medical-mint/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-emerald/20 rounded-full blur-3xl"></div>
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl 
                        bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl mb-4
                        shadow-xl border border-white/20">
                        <span className="text-white text-4xl font-bold">+</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        CarePrep<span className="text-medical-mint"> AI</span>
                    </h1>
                    <p className="text-white/70">Create Your Health Companion Account</p>
                </div>

                {/* Register Card */}
                <div className="glass rounded-3xl shadow-glass p-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Account</h2>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm animate-fade-in">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input-field"
                                placeholder="John Doe"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field"
                                placeholder="••••••••"
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500">At least 6 characters</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="input-field"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 mt-6"
                        >
                            {loading ? (
                                <>
                                    <div className="spinner !h-5 !w-5 !border-2"></div>
                                    <span>Creating account...</span>
                                </>
                            ) : (
                                <span>Create Account</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="text-medical-blue font-medium hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="mt-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <MedicalDisclaimer compact />
                </div>
            </div>
        </div>
    );
};

export default Register;
