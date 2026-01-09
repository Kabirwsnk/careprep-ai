import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';

const Navbar = () => {
    const { user, userData, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navLinks = [
        { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
        { path: '/symptoms', label: 'Symptoms', icon: '📋' },
        { path: '/upload-notes', label: 'Upload Notes', icon: '📄' },
        { path: '/care-summary', label: 'Care Summary', icon: '💊' },
        { path: '/chat', label: 'AI Chat', icon: '💬' },
    ];

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="glass-dark sticky top-0 z-50 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/dashboard" className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-medical-teal to-medical-mint 
                          flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-xl">+</span>
                        </div>
                        <span className="text-white font-bold text-xl hidden sm:block">
                            CarePrep<span className="text-medical-mint"> AI</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 
                          flex items-center space-x-2 ${isActive(link.path)
                                        ? 'bg-white/20 text-white'
                                        : 'text-white/70 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                <span>{link.icon}</span>
                                <span>{link.label}</span>
                            </Link>
                        ))}
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center space-x-4">
                        <div className="hidden sm:flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-emerald to-medical-teal 
                            flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                    {userData?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                </span>
                            </div>
                            <span className="text-white/80 text-sm">
                                {userData?.name || user?.email?.split('@')[0]}
                            </span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-white/70 hover:text-white text-sm font-medium 
                       px-4 py-2 rounded-xl hover:bg-white/10 transition-all duration-300"
                        >
                            Logout
                        </button>

                        {/* Mobile menu button */}
                        <button
                            className="md:hidden text-white p-2"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden pb-4 animate-fade-in">
                        <div className="flex flex-col space-y-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 
                            flex items-center space-x-3 ${isActive(link.path)
                                            ? 'bg-white/20 text-white'
                                            : 'text-white/70 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    <span className="text-lg">{link.icon}</span>
                                    <span>{link.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
