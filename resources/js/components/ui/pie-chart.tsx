interface PieChartProps {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    className?: string;
}

export function PieChart({ percentage, size = 16, strokeWidth = 2, className = "" }: PieChartProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    return (
        <div className={`relative ${className}`} style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                className="transform -rotate-90"
                viewBox={`0 0 ${size} ${size}`}
            >
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="none"
                    className="text-gray-600"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="text-blue-400 transition-all duration-300"
                />
            </svg>
            {/* Optional percentage text for larger charts */}
            {size > 24 && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[8px] font-medium text-white">
                        {Math.round(percentage)}%
                    </span>
                </div>
            )}
        </div>
    );
} 