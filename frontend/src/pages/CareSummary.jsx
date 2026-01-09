import { useState, useEffect } from 'react';
import { visitSummariesAPI, aiAPI } from '../services/api';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

const CareSummary = () => {
    const [summaries, setSummaries] = useState([]);
    const [selectedSummary, setSelectedSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSummaries();
    }, []);

    const fetchSummaries = async () => {
        try {
            setLoading(true);
            const response = await visitSummariesAPI.list();
            setSummaries(response.data.summaries || []);
            if (response.data.summaries?.length > 0) {
                setSelectedSummary(response.data.summaries[0]);
            }
        } catch (err) {
            console.error('Error fetching summaries:', err);
            setError('Failed to load care summaries');
        } finally {
            setLoading(false);
        }
    };

    const MedicationCard = ({ medication }) => (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-start justify-between">
                <div>
                    <h4 className="font-semibold text-gray-800">{medication.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{medication.dosage}</p>
                </div>
                <span className="text-2xl">💊</span>
            </div>
            {medication.timing && (
                <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
                    <span>⏰</span>
                    <span>{medication.timing}</span>
                </div>
            )}
            {medication.notes && (
                <p className="mt-2 text-sm text-gray-500 italic">{medication.notes}</p>
            )}
        </div>
    );

    const FollowUpCard = ({ followUp }) => (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center space-x-3">
                <span className="text-xl">📅</span>
                <div>
                    <p className="font-medium text-gray-800">{followUp.action}</p>
                    {followUp.timing && (
                        <p className="text-sm text-gray-600">{followUp.timing}</p>
                    )}
                </div>
            </div>
        </div>
    );

    const RedFlagCard = ({ flag }) => (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 border border-red-200">
            <div className="flex items-start space-x-3">
                <span className="text-xl">⚠️</span>
                <p className="text-gray-700">{flag}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-medical-light via-primary-50 to-white pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Care Summary 💊</h1>
                    <p className="text-gray-600">AI-simplified explanations of your medical documents</p>
                </div>

                {/* Disclaimer */}
                <div className="mb-8 animate-fade-in">
                    <MedicalDisclaimer />
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 animate-fade-in">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="spinner"></div>
                    </div>
                ) : summaries.length === 0 ? (
                    <div className="card text-center py-16 animate-fade-in">
                        <span className="text-6xl mb-4 block">📋</span>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Care Summaries Yet</h2>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            Upload your medical documents and let AI process them to generate easy-to-understand summaries.
                        </p>
                        <a href="/upload-notes" className="btn-primary inline-block">
                            Upload Documents
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Summary List */}
                        <div className="lg:col-span-1">
                            <div className="card animate-fade-in">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Summaries</h2>
                                <div className="space-y-2">
                                    {summaries.map((summary, index) => (
                                        <button
                                            key={summary.id}
                                            onClick={() => setSelectedSummary(summary)}
                                            className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${selectedSummary?.id === summary.id
                                                    ? 'bg-medical-blue text-white'
                                                    : 'bg-gray-50 hover:bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            <p className="font-medium truncate">
                                                Visit Summary #{summaries.length - index}
                                            </p>
                                            <p className={`text-sm ${selectedSummary?.id === summary.id ? 'text-white/80' : 'text-gray-500'
                                                }`}>
                                                {new Date(summary.createdAt?.seconds * 1000 || summary.createdAt).toLocaleDateString()}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Summary Details */}
                        <div className="lg:col-span-3 space-y-6">
                            {selectedSummary ? (
                                <>
                                    {/* Patient-Friendly Summary */}
                                    <div className="card animate-fade-in">
                                        <div className="flex items-center space-x-3 mb-4">
                                            <span className="text-2xl">📖</span>
                                            <h2 className="text-xl font-semibold text-gray-800">What Your Doctor Said (Simplified)</h2>
                                        </div>
                                        <div className="bg-medical-light/50 rounded-xl p-6 text-gray-700 leading-relaxed whitespace-pre-wrap">
                                            {selectedSummary.patientSummary || 'No patient summary available.'}
                                        </div>
                                    </div>

                                    {/* Medications */}
                                    {selectedSummary.medications && selectedSummary.medications.length > 0 && (
                                        <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
                                            <div className="flex items-center space-x-3 mb-4">
                                                <span className="text-2xl">💊</span>
                                                <h2 className="text-xl font-semibold text-gray-800">Your Medications</h2>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {selectedSummary.medications.map((med, index) => (
                                                    <MedicationCard key={index} medication={med} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Follow-Up Actions */}
                                    {selectedSummary.followUps && selectedSummary.followUps.length > 0 && (
                                        <div className="card animate-fade-in" style={{ animationDelay: '0.15s' }}>
                                            <div className="flex items-center space-x-3 mb-4">
                                                <span className="text-2xl">📅</span>
                                                <h2 className="text-xl font-semibold text-gray-800">Follow-Up Checklist</h2>
                                            </div>
                                            <div className="space-y-3">
                                                {selectedSummary.followUps.map((followUp, index) => (
                                                    <FollowUpCard key={index} followUp={followUp} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Red Flags */}
                                    {selectedSummary.redFlags && selectedSummary.redFlags.length > 0 && (
                                        <div className="card animate-fade-in border-2 border-red-200" style={{ animationDelay: '0.2s' }}>
                                            <div className="flex items-center space-x-3 mb-4">
                                                <span className="text-2xl">🚨</span>
                                                <h2 className="text-xl font-semibold text-gray-800">When to Seek Help</h2>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-4">
                                                Contact your healthcare provider or seek emergency care if you experience:
                                            </p>
                                            <div className="space-y-3">
                                                {selectedSummary.redFlags.map((flag, index) => (
                                                    <RedFlagCard key={index} flag={flag} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Doctor's Original Summary */}
                                    {selectedSummary.doctorSummary && (
                                        <div className="card animate-fade-in" style={{ animationDelay: '0.25s' }}>
                                            <details className="group">
                                                <summary className="flex items-center justify-between cursor-pointer">
                                                    <div className="flex items-center space-x-3">
                                                        <span className="text-2xl">🩺</span>
                                                        <h2 className="text-xl font-semibold text-gray-800">Medical Summary (Technical)</h2>
                                                    </div>
                                                    <span className="transform transition-transform duration-200 group-open:rotate-180">
                                                        ▼
                                                    </span>
                                                </summary>
                                                <div className="mt-4 bg-gray-50 rounded-xl p-6 text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                                                    {selectedSummary.doctorSummary}
                                                </div>
                                            </details>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="card text-center py-12">
                                    <p className="text-gray-500">Select a summary to view details</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CareSummary;
