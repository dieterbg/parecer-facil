export function FloresceLogo({ className = "" }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 1000 280"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Mão */}
            <g>
                <path d="M80 180 Q70 160, 90 155 L100 180 Z" fill="#2D7A4F" />
                <path d="M95 180 Q90 155, 110 150 L120 180 Z" fill="#2D7A4F" />
                <path d="M115 180 Q115 150, 135 148 L140 180 Z" fill="#2D7A4F" />
                <path d="M135 180 Q140 155, 155 158 L158 180 Z" fill="#2D7A4F" />
                <ellipse cx="120" cy="200" rx="60" ry="35" fill="#2D7A4F" />
            </g>

            {/* Planta */}
            <g>
                <ellipse cx="105" cy="140" rx="12" ry="25" fill="#059669" transform="rotate(-25 105 140)" />
                <ellipse cx="125" cy="125" rx="14" ry="28" fill="#10B981" transform="rotate(10 125 125)" />
                <ellipse cx="140" cy="135" rx="11" ry="24" fill="#059669" transform="rotate(35 140 135)" />
                <line x1="120" y1="165" x2="120" y2="190" stroke="#2D7A4F" strokeWidth="3" />
            </g>

            {/* Brilho roxo */}
            <ellipse cx="120" cy="150" rx="45" ry="35" fill="#8B5CF6" opacity="0.3" />
            <ellipse cx="120" cy="155" rx="30" ry="25" fill="#A78BFA" opacity="0.4" />

            {/* Texto "floresce" */}
            <text x="200" y="180" fontFamily="Arial, sans-serif" fontSize="90" fontWeight="bold" fill="#1F2937">
                floresce
            </text>

            {/* Texto ".ai" */}
            <text x="700" y="180" fontFamily="Arial, sans-serif" fontSize="90" fontWeight="bold" fill="#8B5CF6">
                .ai
            </text>
        </svg>
    );
}
