import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-light via-primary-100 to-medical-mint">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4"></div>
                    <p className="text-medical-blue font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
