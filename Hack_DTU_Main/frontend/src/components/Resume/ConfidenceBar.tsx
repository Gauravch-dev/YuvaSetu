import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ConfidenceBarProps {
    confidence: number | null;
    warnings: string[];
    className?: string;
}

/**
 * Parsing Confidence Indicator
 * - GREEN: High confidence (≥70)
 * - YELLOW: Needs review (30-69)
 * - RED: Low confidence (<30)
 */
export const ConfidenceBar = ({ confidence, warnings, className = '' }: ConfidenceBarProps) => {
    if (confidence === null) return null;

    const getLevel = () => {
        if (confidence >= 70) return 'high';
        if (confidence >= 30) return 'medium';
        return 'low';
    };

    const level = getLevel();

    const config = {
        high: {
            color: 'bg-green-500',
            bgColor: 'bg-green-50 border-green-200',
            textColor: 'text-green-800',
            icon: CheckCircle,
            label: 'High Confidence',
            description: 'Resume parsed successfully. Please review the auto-filled data.'
        },
        medium: {
            color: 'bg-yellow-500',
            bgColor: 'bg-yellow-50 border-yellow-200',
            textColor: 'text-yellow-800',
            icon: AlertTriangle,
            label: 'Needs Review',
            description: 'Some fields may need manual correction.'
        },
        low: {
            color: 'bg-red-500',
            bgColor: 'bg-red-50 border-red-200',
            textColor: 'text-red-800',
            icon: XCircle,
            label: 'Low Confidence',
            description: 'We couldn\'t reliably extract your details. Please fill manually.'
        }
    };

    const { color, bgColor, textColor, icon: Icon, label, description } = config[level];

    return (
        <div className={`rounded-lg border p-4 ${bgColor} ${className}`}>
            <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 ${textColor}`} />
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <span className={`font-semibold ${textColor}`}>{label}</span>
                        <span className={`text-sm font-medium ${textColor}`}>{confidence}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden mb-2">
                        <div
                            className={`h-full ${color} transition-all duration-500`}
                            style={{ width: `${confidence}%` }}
                        />
                    </div>

                    <p className={`text-sm ${textColor} opacity-90`}>{description}</p>

                    {/* Warnings */}
                    {warnings.length > 0 && (
                        <ul className={`mt-2 text-sm ${textColor} opacity-80 list-disc list-inside`}>
                            {warnings.map((warning, i) => (
                                <li key={i}>{warning}</li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConfidenceBar;
