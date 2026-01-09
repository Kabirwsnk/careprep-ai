const MedicalDisclaimer = ({ compact = false }) => {
    if (compact) {
        return (
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl px-4 py-2 text-xs text-amber-800 
                    flex items-center space-x-2">
                <span className="text-amber-500">⚠️</span>
                <span>
                    <strong>Disclaimer:</strong> This is not medical advice. Always consult a healthcare professional.
                </span>
            </div>
        );
    }

    return (
        <div className="disclaimer animate-fade-in">
            <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                    <span className="text-2xl">⚠️</span>
                </div>
                <div>
                    <h4 className="font-semibold text-amber-800 mb-1">Important Medical Disclaimer</h4>
                    <p className="text-amber-700 text-sm leading-relaxed">
                        CarePrep AI is an <strong>educational and organizational tool only</strong>.
                        It does <strong>NOT</strong> provide medical advice, diagnosis, or treatment recommendations.
                    </p>
                    <ul className="mt-2 text-sm text-amber-700 space-y-1">
                        <li>• All information is for informational purposes only</li>
                        <li>• Always consult a qualified healthcare professional</li>
                        <li>• Never disregard professional medical advice</li>
                        <li>• In case of emergency, call emergency services immediately</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default MedicalDisclaimer;
