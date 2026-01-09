import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { symptomsAPI } from '../services/api';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const Symptoms = () => {
    const [symptoms, setSymptoms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [generatingSummary, setGeneratingSummary] = useState(false);
    const [summary, setSummary] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        symptom: '',
        severity: 5,
        notes: '',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchSymptoms();
    }, []);

    const fetchSymptoms = async () => {
        try {
            setLoading(true);
            const response = await symptomsAPI.list();
            setSymptoms(response.data.symptoms || []);
        } catch (err) {
            console.error('Error fetching symptoms:', err);
            setError('Failed to load symptoms');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            await symptomsAPI.add(formData);
            setSuccess('Symptom logged successfully!');
            setFormData({
                symptom: '',
                severity: 5,
                notes: '',
                date: new Date().toISOString().split('T')[0]
            });
            fetchSymptoms();
        } catch (err) {
            console.error('Error adding symptom:', err);
            setError('Failed to log symptom. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this symptom?')) return;

        try {
            await symptomsAPI.delete(id);
            fetchSymptoms();
        } catch (err) {
            console.error('Error deleting symptom:', err);
            setError('Failed to delete symptom');
        }
    };

    const generateSummary = async () => {
        if (symptoms.length === 0) {
            setError('Please log some symptoms before generating a summary.');
            return;
        }

        setGeneratingSummary(true);
        setError('');

        try {
            const response = await symptomsAPI.generateSummary();
            setSummary(response.data.summary);
        } catch (err) {
            console.error('Error generating summary:', err);
            setError('Failed to generate summary. Please try again.');
        } finally {
            setGeneratingSummary(false);
        }
    };

    const getSeverityColor = (severity) => {
        if (severity <= 3) return 'severity-low';
        if (severity <= 6) return 'severity-medium';
        return 'severity-high';
    };

    // Chart data
    const chartData = {
        labels: symptoms.slice(-14).map(s =>
            new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        ),
        datasets: [{
            label: 'Symptom Severity',
            data: symptoms.slice(-14).map(s => s.severity),
            fill: true,
            backgroundColor: 'rgba(0, 119, 182, 0.1)',
            borderColor: 'rgba(0, 119, 182, 1)',
            borderWidth: 3,
            tension: 0.4,
            pointBackgroundColor: 'rgba(0, 180, 216, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(2, 62, 138, 0.95)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12,
                cornerRadius: 12,
                displayColors: false
            }
        },
        scales: {
            y: {
                min: 0,
                max: 10,
                ticks: {
                    stepSize: 2,
                    color: '#64748b'
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            },
            x: {
                ticks: {
                    color: '#64748b'
                },
                grid: {
                    display: false
                }
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-medical-light via-primary-50 to-white pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Symptom Tracker 📋</h1>
                    <p className="text-gray-600">Log your daily symptoms to prepare for your doctor visit</p>
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Symptom Form */}
                    <div className="lg:col-span-1">
                        <div className="card animate-fade-in">
                            <h2 className="text-xl font-semibold text-gray-800 mb-6">Log New Symptom</h2>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="input-field"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Symptom
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.symptom}
                                        onChange={(e) => setFormData({ ...formData, symptom: e.target.value })}
                                        className="input-field"
                                        placeholder="e.g., Headache, Fatigue, Nausea"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Severity: <span className="text-medical-blue font-bold">{formData.severity}/10</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={formData.severity}
                                        onChange={(e) => setFormData({ ...formData, severity: parseInt(e.target.value) })}
                                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-medical-blue"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>Mild</span>
                                        <span>Moderate</span>
                                        <span>Severe</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notes (optional)
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="input-field min-h-[100px] resize-none"
                                        placeholder="Any additional details about your symptom..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-primary w-full flex items-center justify-center space-x-2"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="spinner !h-5 !w-5 !border-2"></div>
                                            <span>Logging...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>➕</span>
                                            <span>Log Symptom</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Generate Summary Button */}
                        <div className="mt-6">
                            <button
                                onClick={generateSummary}
                                disabled={generatingSummary || symptoms.length === 0}
                                className="btn-secondary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
                            >
                                {generatingSummary ? (
                                    <>
                                        <div className="spinner !h-5 !w-5 !border-2 !border-medical-blue !border-t-transparent"></div>
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>🤖</span>
                                        <span>Generate Doctor Summary</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Timeline & History */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Chart */}
                        <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Severity Timeline</h2>
                            {symptoms.length > 0 ? (
                                <div className="h-64">
                                    <Line data={chartData} options={chartOptions} />
                                </div>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-gray-500">
                                    <div className="text-center">
                                        <span className="text-4xl mb-2 block">📈</span>
                                        <p>Log symptoms to see your timeline</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* AI Summary */}
                        {summary && (
                            <div className="card animate-fade-in border-2 border-medical-teal">
                                <div className="flex items-center space-x-2 mb-4">
                                    <span className="text-2xl">🤖</span>
                                    <h2 className="text-xl font-semibold text-gray-800">AI Summary for Your Doctor</h2>
                                </div>
                                <div className="bg-medical-light/50 rounded-xl p-4 text-gray-700 whitespace-pre-wrap">
                                    {summary}
                                </div>
                                <MedicalDisclaimer compact />
                            </div>
                        )}

                        {/* Symptom History */}
                        <div className="card animate-fade-in" style={{ animationDelay: '0.2s' }}>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Symptoms</h2>

                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="spinner"></div>
                                </div>
                            ) : symptoms.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <span className="text-4xl mb-2 block">📝</span>
                                    <p>No symptoms logged yet. Start by adding your first symptom!</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {symptoms.slice().reverse().map((symptom, index) => (
                                        <div
                                            key={symptom.id || index}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl 
                               hover:bg-gray-100 transition-colors duration-200 group"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(symptom.severity)}`}>
                                                    {symptom.severity}/10
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800">{symptom.symptom}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(symptom.date).toLocaleDateString('en-US', {
                                                            weekday: 'short',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                        {symptom.notes && ` • ${symptom.notes.substring(0, 50)}${symptom.notes.length > 50 ? '...' : ''}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(symptom.id)}
                                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 
                                 transition-all duration-200 p-2"
                                                title="Delete symptom"
                                            >
                                                🗑️
                                            </button>
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

export default Symptoms;
