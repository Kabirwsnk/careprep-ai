import { useState, useEffect, useCallback } from 'react';
import { documentsAPI, aiAPI } from '../services/api';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

const UploadNotes = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [dragActive, setDragActive] = useState(false);

    const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
        'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
    ];

    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'csv', 'xlsx', 'xls'];

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await documentsAPI.list();
            setDocuments(response.data.documents || []);
        } catch (err) {
            console.error('Error fetching documents:', err);
            setError('Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const validateFile = (file) => {
        const extension = file.name.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(extension)) {
            return `Invalid file type. Allowed: ${allowedExtensions.join(', ')}`;
        }
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            return 'File size exceeds 10MB limit';
        }
        return null;
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    }, []);

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files);
        }
    };

    const handleFiles = async (files) => {
        const file = files[0];
        const validationError = validateFile(file);

        if (validationError) {
            setError(validationError);
            return;
        }

        setError('');
        setSuccess('');
        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await documentsAPI.upload(formData);
            setSuccess(`"${file.name}" uploaded successfully!`);
            fetchDocuments();
        } catch (err) {
            console.error('Error uploading file:', err);
            setError('Failed to upload file. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleProcess = async (docId) => {
        setProcessing(docId);
        setError('');

        try {
            await aiAPI.summarize(docId);
            setSuccess('Document processed successfully!');
            fetchDocuments();
        } catch (err) {
            console.error('Error processing document:', err);
            setError('Failed to process document. Please try again.');
        } finally {
            setProcessing(null);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            await documentsAPI.delete(id);
            fetchDocuments();
        } catch (err) {
            console.error('Error deleting document:', err);
            setError('Failed to delete document');
        }
    };

    const getFileIcon = (fileType) => {
        if (fileType?.includes('pdf')) return '📄';
        if (fileType?.includes('image')) return '🖼️';
        if (fileType?.includes('csv') || fileType?.includes('excel') || fileType?.includes('spreadsheet')) return '📊';
        return '📁';
    };

    const getStatusBadge = (doc) => {
        if (doc.processedText) {
            return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">Processed</span>;
        }
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">Pending</span>;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-medical-light via-primary-50 to-white pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Upload Medical Documents 📄</h1>
                    <p className="text-gray-600">Upload visit notes, prescriptions, and test results for AI processing</p>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 animate-fade-in">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 animate-fade-in">
                        {success}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Upload Area */}
                    <div className="animate-fade-in">
                        <div className="card">
                            <h2 className="text-xl font-semibold text-gray-800 mb-6">Upload New Document</h2>

                            {/* Drop Zone */}
                            <div
                                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${dragActive
                                        ? 'border-medical-teal bg-medical-light/50 scale-[1.02]'
                                        : 'border-gray-300 hover:border-medical-blue hover:bg-gray-50'
                                    }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                {uploading ? (
                                    <div className="py-8">
                                        <div className="spinner mx-auto mb-4"></div>
                                        <p className="text-medical-blue font-medium">Uploading...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-6xl mb-4 animate-float">📤</div>
                                        <p className="text-lg font-medium text-gray-700 mb-2">
                                            Drag and drop your file here
                                        </p>
                                        <p className="text-gray-500 mb-4">or</p>
                                        <label className="btn-primary cursor-pointer inline-block">
                                            <span>Choose File</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx,.xls"
                                                onChange={handleFileInput}
                                            />
                                        </label>
                                        <p className="text-sm text-gray-500 mt-4">
                                            Supported: PDF, Images (JPG, PNG), CSV, Excel (XLSX, XLS)
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">Max file size: 10MB</p>
                                    </>
                                )}
                            </div>

                            {/* Disclaimer */}
                            <div className="mt-6">
                                <MedicalDisclaimer compact />
                            </div>
                        </div>

                        {/* Processing Info */}
                        <div className="card mt-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                            <h3 className="font-semibold text-gray-800 mb-3">How it works</h3>
                            <div className="space-y-3">
                                <div className="flex items-start space-x-3">
                                    <span className="flex-shrink-0 w-8 h-8 bg-medical-light rounded-lg flex items-center justify-center text-medical-blue font-bold">1</span>
                                    <div>
                                        <p className="font-medium text-gray-700">Upload</p>
                                        <p className="text-sm text-gray-500">Upload your medical document</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <span className="flex-shrink-0 w-8 h-8 bg-medical-light rounded-lg flex items-center justify-center text-medical-blue font-bold">2</span>
                                    <div>
                                        <p className="font-medium text-gray-700">Process</p>
                                        <p className="text-sm text-gray-500">AI extracts text using OCR</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <span className="flex-shrink-0 w-8 h-8 bg-medical-light rounded-lg flex items-center justify-center text-medical-blue font-bold">3</span>
                                    <div>
                                        <p className="font-medium text-gray-700">Understand</p>
                                        <p className="text-sm text-gray-500">View simplified explanations in Care Summary</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Documents List */}
                    <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="card">
                            <h2 className="text-xl font-semibold text-gray-800 mb-6">Your Documents</h2>

                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="spinner"></div>
                                </div>
                            ) : documents.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <span className="text-5xl mb-4 block">📁</span>
                                    <p className="font-medium">No documents uploaded yet</p>
                                    <p className="text-sm mt-1">Upload your first medical document to get started</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                                    {documents.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl 
                               hover:bg-gray-100 transition-colors duration-200 group"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center 
                                      text-2xl shadow-sm">
                                                    {getFileIcon(doc.fileType)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800 truncate max-w-[200px]">
                                                        {doc.fileName || 'Untitled Document'}
                                                    </p>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        {getStatusBadge(doc)}
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(doc.createdAt?.seconds * 1000 || doc.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {!doc.processedText && (
                                                    <button
                                                        onClick={() => handleProcess(doc.id)}
                                                        disabled={processing === doc.id}
                                                        className="px-3 py-1.5 bg-medical-blue text-white text-sm rounded-lg 
                                     hover:bg-medical-dark transition-colors duration-200 
                                     disabled:opacity-50 flex items-center space-x-1"
                                                    >
                                                        {processing === doc.id ? (
                                                            <>
                                                                <div className="spinner !h-4 !w-4 !border-2"></div>
                                                                <span>Processing</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span>🤖</span>
                                                                <span>Process</span>
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(doc.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 
                                   transition-all duration-200 p-2"
                                                    title="Delete document"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadNotes;
