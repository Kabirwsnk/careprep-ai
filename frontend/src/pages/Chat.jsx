import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { aiAPI, symptomsAPI, visitSummariesAPI } from '../services/api';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

const Chat = () => {
    const [searchParams] = useSearchParams();
    const [mode, setMode] = useState(searchParams.get('mode') || 'pre_visit');
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [context, setContext] = useState({ symptoms: [], summary: null });
    const messagesEndRef = useRef(null);

    // Fetch context based on mode
    useEffect(() => {
        fetchContext();
    }, [mode]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchContext = async () => {
        try {
            if (mode === 'pre_visit') {
                const response = await symptomsAPI.list();
                setContext({ symptoms: response.data.symptoms || [], summary: null });
            } else {
                const response = await visitSummariesAPI.getLatest();
                setContext({ symptoms: [], summary: response.data.summary || null });
            }
        } catch (err) {
            console.error('Error fetching context:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = { role: 'user', content: input, timestamp: new Date() };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await aiAPI.chat(input, mode, context);
            const aiMessage = {
                role: 'assistant',
                content: response.data.response,
                timestamp: new Date()
            };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (err) {
            console.error('Error sending message:', err);
            const errorMessage = {
                role: 'assistant',
                content: "I'm sorry, I encountered an error processing your request. Please try again.",
                timestamp: new Date(),
                error: true
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const suggestedQuestions = {
        pre_visit: [
            "What should I tell my doctor about my symptoms?",
            "How do I describe my symptom severity clearly?",
            "What questions should I ask during my visit?",
            "Can you summarize my symptom history?"
        ],
        post_visit: [
            "Can you explain my diagnosis in simple terms?",
            "What does this medication do?",
            "When should I take my medications?",
            "What symptoms should I watch out for?"
        ]
    };

    const handleSuggestionClick = (question) => {
        setInput(question);
    };

    const ChatMessage = ({ message }) => (
        <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                {message.role === 'assistant' && (
                    <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-gray-100">
                        <span className="text-lg">🤖</span>
                        <span className="text-sm font-medium text-medical-blue">CarePrep AI</span>
                    </div>
                )}
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.role === 'assistant' && !message.error && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <MedicalDisclaimer compact />
                    </div>
                )}
                <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-medical-light via-primary-50 to-white flex flex-col">
            <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-6 animate-fade-in">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">AI Chat Assistant 💬</h1>
                    <p className="text-gray-600">Ask questions about your health journey</p>
                </div>

                {/* Mode Toggle */}
                <div className="card mb-6 animate-fade-in">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-2">Chat Mode</p>
                            <div className="flex bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={() => setMode('pre_visit')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${mode === 'pre_visit'
                                            ? 'bg-white text-medical-blue shadow-sm'
                                            : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                >
                                    🩺 Pre-Visit
                                </button>
                                <button
                                    onClick={() => setMode('post_visit')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${mode === 'post_visit'
                                            ? 'bg-white text-medical-blue shadow-sm'
                                            : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                >
                                    📋 Post-Visit
                                </button>
                            </div>
                        </div>
                        <div className="text-sm text-gray-500">
                            {mode === 'pre_visit' ? (
                                <span>💡 I'll help you prepare for your doctor appointment</span>
                            ) : (
                                <span>💡 I'll help you understand your visit notes</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col">
                    <div className="card flex-1 flex flex-col min-h-[400px] animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                            {messages.length === 0 ? (
                                <div className="text-center py-12">
                                    <span className="text-5xl mb-4 block animate-float">🤖</span>
                                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                                        Hi! I'm your CarePrep AI Assistant
                                    </h2>
                                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                        {mode === 'pre_visit'
                                            ? "I can help you prepare for your doctor's appointment. Ask me about your symptoms or what to discuss with your doctor."
                                            : "I can help you understand your visit notes and medications. Ask me about your diagnosis, treatment, or follow-up care."}
                                    </p>

                                    {/* Suggested Questions */}
                                    <div className="max-w-lg mx-auto">
                                        <p className="text-sm text-gray-500 mb-3">Try asking:</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {suggestedQuestions[mode].map((question, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => handleSuggestionClick(question)}
                                                    className="text-left px-4 py-3 bg-gray-50 hover:bg-medical-light/50 
                                   rounded-xl text-sm text-gray-700 transition-all duration-200
                                   hover:border-medical-teal border border-transparent"
                                                >
                                                    {question}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                messages.map((message, index) => (
                                    <ChatMessage key={index} message={message} />
                                ))
                            )}

                            {/* Loading indicator */}
                            {loading && (
                                <div className="flex justify-start animate-fade-in">
                                    <div className="chat-bubble-ai">
                                        <div className="flex items-center space-x-2">
                                            <div className="flex space-x-1">
                                                <div className="w-2 h-2 bg-medical-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                <div className="w-2 h-2 bg-medical-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                <div className="w-2 h-2 bg-medical-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                            </div>
                                            <span className="text-sm text-gray-500">Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Form */}
                        <form onSubmit={handleSubmit} className="flex space-x-3">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={
                                    mode === 'pre_visit'
                                        ? "Ask about preparing for your visit..."
                                        : "Ask about your visit notes or medications..."
                                }
                                className="input-field flex-1"
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="btn-primary px-6 disabled:opacity-50 flex items-center space-x-2"
                            >
                                <span>Send</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom Disclaimer */}
                <div className="mt-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <MedicalDisclaimer compact />
                </div>
            </div>
        </div>
    );
};

export default Chat;
