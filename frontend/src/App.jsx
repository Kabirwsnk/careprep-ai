import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Symptoms from './pages/Symptoms';
import UploadNotes from './pages/UploadNotes';
import CareSummary from './pages/CareSummary';
import Chat from './pages/Chat';

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen">
                    <Routes>
                        {/* Public routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Protected routes */}
                        <Route path="/" element={
                            <ProtectedRoute>
                                <Navbar />
                                <Dashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/dashboard" element={
                            <ProtectedRoute>
                                <Navbar />
                                <Dashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/symptoms" element={
                            <ProtectedRoute>
                                <Navbar />
                                <Symptoms />
                            </ProtectedRoute>
                        } />
                        <Route path="/upload-notes" element={
                            <ProtectedRoute>
                                <Navbar />
                                <UploadNotes />
                            </ProtectedRoute>
                        } />
                        <Route path="/care-summary" element={
                            <ProtectedRoute>
                                <Navbar />
                                <CareSummary />
                            </ProtectedRoute>
                        } />
                        <Route path="/chat" element={
                            <ProtectedRoute>
                                <Navbar />
                                <Chat />
                            </ProtectedRoute>
                        } />

                        {/* Catch all - redirect to dashboard */}
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
