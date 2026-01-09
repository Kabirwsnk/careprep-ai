import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            console.error('Login error:', err);
            if (err.code === 'auth/user-not-found') {
                setError('No account found with this email.');
            } else if (err.code === 'auth/wrong-password') {
                setError('Incorrect password. Please try again.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Invalid email address.');
            } else {
                setError('Failed to sign in. Please try again.');
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
                    <p className="text-white/70">Your Medical Intelligence Assistant</p>
                </div>

                {/* Login Card */}
                <div className="glass rounded-3xl shadow-glass p-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Welcome Back</h2>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm animate-fade-in">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
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
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <div className="spinner !h-5 !w-5 !border-2"></div>
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <span>Sign In</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-medical-blue font-medium hover:underline">
                                Create one
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

export default Login;
