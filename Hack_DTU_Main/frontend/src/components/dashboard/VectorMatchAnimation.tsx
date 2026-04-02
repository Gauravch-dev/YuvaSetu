import { useEffect, useRef } from 'react';

interface VectorMatchAnimationProps {
    score: number; // 0 to 100
    width?: number;
    height?: number;
}

export const VectorMatchAnimation = ({ score, width = 280, height = 160 }: VectorMatchAnimationProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Normalize score to angle
        // Socre 100 -> cos(theta)=1 -> theta=0
        // Score 0 -> cos(theta)=0 -> theta=PI/2 (90 deg)
        // We clamp score between 0 and 100
        const textScore = Math.max(0, Math.min(100, score));
        const similarity = textScore / 100;
        const targetAngle = Math.acos(similarity); // Radians

        let currentAngle = Math.PI / 2; // Start at 90 deg
        let animationFrameId: number;
        let startTime: number | null = null;
        const duration = 1500; // ms

        const draw = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = (x: number): number => 1 - Math.pow(1 - x, 4);

            const easedProgress = easeOutQuart(progress);
            currentAngle = (Math.PI / 2) - ((Math.PI / 2 - targetAngle) * easedProgress);

            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            // Setup
            const centerX = width / 2;
            const centerY = height - 20;
            const vectorLength = Math.min(width, height) * 0.7;

            // Draw Grid/Coordinate System (Abstract)
            ctx.strokeStyle = '#1e293b'; // slate-800
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(centerX, centerY, vectorLength, Math.PI, 0); // Semicircle
            ctx.stroke();

            // Dashed lines for reference
            for (let i = 1; i <= 3; i++) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, vectorLength * (i / 4), Math.PI, 0);
                ctx.stroke();
            }

            // Draw Job Vector (Fixed at roughly 45 deg)
            // Reference Vector (Job) at -PI/4 (45 degrees up-rightish from left, or top-right)
            const jobAngle = -Math.PI / 4;

            // User Vector moves towards Job Vector
            // If angle is 0, they overlap.
            // angle is relative difference.
            const userAngle = jobAngle + currentAngle;


            // Helper to draw Arrow
            const drawArrow = (angle: number, color: string, label: string) => {
                const endX = centerX + Math.cos(angle) * vectorLength;
                const endY = centerY + Math.sin(angle) * vectorLength;

                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(endX, endY);
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.stroke();

                // Arrow head
                const headLen = 10;
                ctx.beginPath();
                ctx.moveTo(endX, endY);
                ctx.lineTo(endX - headLen * Math.cos(angle - Math.PI / 6), endY - headLen * Math.sin(angle - Math.PI / 6));
                ctx.moveTo(endX, endY);
                ctx.lineTo(endX - headLen * Math.cos(angle + Math.PI / 6), endY - headLen * Math.sin(angle + Math.PI / 6));
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.stroke();

                // Label
                ctx.fillStyle = color;
                ctx.font = 'bold 12px sans-serif';
                // Offset label
                ctx.fillText(label, endX + (Math.cos(angle) * 20), endY + (Math.sin(angle) * 20));
            };

            // Draw Angle Arc
            if (currentAngle > 0.1) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, vectorLength * 0.3, jobAngle, userAngle, false);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 3]);
                ctx.stroke();
                ctx.setLineDash([]);

                // Draw Angle Label
                const midAngle = jobAngle + (currentAngle / 2);
                const labelX = centerX + Math.cos(midAngle) * (vectorLength * 0.45);
                const labelY = centerY + Math.sin(midAngle) * (vectorLength * 0.45);
                ctx.fillStyle = '#94a3b8'; // slate-400
                ctx.font = '10px monospace';
                ctx.fillText(`θ=${Math.round(currentAngle * (180 / Math.PI))}°`, labelX - 15, labelY);
            }

            // Draw Vectors
            drawArrow(jobAngle, '#22c55e', 'Job'); // Green
            drawArrow(userAngle, '#6366f1', 'You'); // Indigo (User)

            // Draw Score Text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText(`${Math.round(easedProgress * textScore)}% Similarity`, 10, 20);

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(draw);
            }
        };

        animationFrameId = requestAnimationFrame(draw);

        return () => cancelAnimationFrame(animationFrameId);
    }, [score, width, height]);

    return <canvas ref={canvasRef} width={width} height={height} className="rounded-md bg-slate-900 border border-slate-800 w-full mb-3" />;
};
