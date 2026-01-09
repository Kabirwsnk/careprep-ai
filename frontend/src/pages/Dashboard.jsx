import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

const Dashboard = () => {
    const { userData, user } = useAuth();

    const features = [
        {
            title: 'Log Symptoms',
            description: 'Track your daily symptoms with severity and notes',
            icon: '📋',
            path: '/symptoms',
            color: 'from-accent-emerald to-teal-500',
            bgColor: 'bg-teal-50'
        },
        {
            title: 'Upload Notes',
            description: 'Upload visit notes, prescriptions, and reports',
            icon: '📄',
            path: '/upload-notes',
            color: 'from-medical-blue to-primary-500',
            bgColor: 'bg-blue-50'
        },
        {
            title: 'Care Summary',
            description: 'View AI-simplified explanations of your documents',
            icon: '💊',
            path: '/care-summary',
            color: 'from-purple-500 to-pink-500',
            bgColor: 'bg-purple-50'
        },
        {
            title: 'AI Chat',
            description: 'Ask questions about your health journey',
            icon: '💬',
            path: '/chat',
            color: 'from-accent-coral to-orange-500',
            bgColor: 'bg-orange-50'
        }
    ];

    const quickActions = [
        { label: 'Pre-Visit Prep', icon: '🩺', description: 'Prepare for your doctor appointment', path: '/chat?mode=pre_visit' },
        { label: 'Understand Notes', icon: '📖', description: 'Simplify your medical documents', path: '/care-summary' },
        { label: 'Track Today', icon: '📊', description: 'Log how you\'re feeling today', path: '/symptoms' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-medical-light via-primary-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Header */}
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                        Welcome back, <span className="text-medical-blue">{userData?.name || user?.email?.split('@')[0]}</span>! 👋
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Your personal medical intelligence assistant is ready to help.
                    </p>
                </div>

                {/* Medical Disclaimer */}
                <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <MedicalDisclaimer />
                </div>

                {/* Quick Actions */}
                <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.15s' }}>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {quickActions.map((action, index) => (
                            <Link
                                key={action.label}
                                to={action.path}
                                className="card-interactive flex items-center space-x-4 group"
                                style={{ animationDelay: `${0.2 + index * 0.05}s` }}
                            >
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-medical-blue to-medical-teal 
                              flex items-center justify-center text-2xl shadow-lg 
                              group-hover:scale-110 transition-transform duration-300">
                                    {action.icon}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">{action.label}</h3>
                                    <p className="text-sm text-gray-500">{action.description}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Feature Cards */}
                <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.25s' }}>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">What would you like to do?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
                            <Link
                                key={feature.title}
                                to={feature.path}
                                className="group relative overflow-hidden rounded-2xl shadow-soft hover:shadow-glass 
                         transition-all duration-500 hover:-translate-y-2"
                                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 
                              group-hover:opacity-100 transition-opacity duration-500`}></div>
                                <div className={`relative ${feature.bgColor} group-hover:bg-transparent p-6 h-full 
                              transition-all duration-500`}>
                                    <div className="text-4xl mb-4 transform group-hover:scale-110 
                                transition-transform duration-300">
                                        {feature.icon}
                                    </div>
                                    <h3 className="font-bold text-lg text-gray-800 group-hover:text-white 
                               transition-colors duration-300 mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 group-hover:text-white/90 
                              transition-colors duration-300">
                                        {feature.description}
                                    </p>
                                    <div className="mt-4 flex items-center text-medical-blue group-hover:text-white 
                                font-medium text-sm transition-colors duration-300">
                                        <span>Get Started</span>
                                        <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 
                                  transition-transform duration-300"
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Stats Overview (placeholder for actual data) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Total Symptoms Logged</p>
                                <p className="text-3xl font-bold text-medical-blue mt-1">--</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                                <span className="text-2xl">📊</span>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Documents Processed</p>
                                <p className="text-3xl font-bold text-medical-blue mt-1">--</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <span className="text-2xl">📁</span>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">AI Conversations</p>
                                <p className="text-3xl font-bold text-medical-blue mt-1">--</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                <span className="text-2xl">💬</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
