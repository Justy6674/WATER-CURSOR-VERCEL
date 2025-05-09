
import { useEffect, useState } from "react";

interface WaterRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  showAnimation?: boolean;
}

export function WaterRing({
  percentage,
  size = 200,
  strokeWidth = 16,
  showAnimation = true,
}: WaterRingProps) {
  const [progress, setProgress] = useState(0);
  const [animate, setAnimate] = useState(false);
  const [splash, setSplash] = useState(false);
  
  // Animation effect
  useEffect(() => {
    // Set initial delay
    const timer = setTimeout(() => {
      setProgress(percentage);
    }, 100);
    
    // Trigger animation when percentage changes significantly
    if (Math.abs(percentage - progress) > 2) {
      setAnimate(true);
      setSplash(true);
      setTimeout(() => setAnimate(false), 1000);
      setTimeout(() => setSplash(false), 600);
    }
    
    return () => clearTimeout(timer);
  }, [percentage]);

  const normalizedPercentage = Math.min(100, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - normalizedPercentage / 100);
  
  // Enhanced color handling for water-like appearance
  const getProgressColor = () => {
    if (progress >= 100) return '#10b981'; // Green for completion
    if (progress >= 75) return '#3b82f6'; // Blue for good progress
    if (progress >= 50) return '#5271ff'; // Default blue
    if (progress >= 25) return '#60a5fa'; // Light blue for some progress
    return '#93c5fd'; // Very light blue for low progress
  };
  
  // For the water wave effect
  const waveAmplitude = radius * 0.05;
  const waveFrequency = 20;
  
  // Achievement levels based on percentage
  const getAchievementLevel = () => {
    if (progress >= 100) return "Hydration Beast!";
    if (progress >= 75) return "Hydration Pro";
    if (progress >= 50) return "Hydration Adept";
    if (progress >= 25) return "Hydration Rookie";
    return "Dehydrated";
  };
  
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={`transition-all duration-500 ${animate ? "animate-pulse" : ""}`}
      >
        {/* Enhanced ripple effect circles for animation */}
        {showAnimation && animate && (
          <>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius + 10}
              fill="none"
              stroke="rgba(82, 113, 255, 0.2)"
              strokeWidth="2"
              className="animate-ping"
              style={{ animationDuration: "1.5s" }}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius + 20}
              fill="none"
              stroke="rgba(82, 113, 255, 0.1)"
              strokeWidth="1"
              className="animate-ping"
              style={{ animationDuration: "2s", animationDelay: "0.2s" }}
            />
          </>
        )}
        
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="ring-progress-track"
          strokeWidth={strokeWidth}
        />
        
        {/* Enhanced water-like effect */}
        {progress > 0 && (
          <>
            <clipPath id="progressClip">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius - strokeWidth / 4}
              />
            </clipPath>
            
            <g clipPath="url(#progressClip)">
              {/* Water filling effect with gradient */}
              <linearGradient id="waterGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={getProgressColor()} stopOpacity="0.7" />
                <stop offset="100%" stopColor={getProgressColor()} stopOpacity="0.3" />
              </linearGradient>
              
              <rect
                x="0"
                y={size - (size * normalizedPercentage / 100)}
                width={size}
                height={size}
                fill="url(#waterGradient)"
                className="transition-all duration-1000"
              />
              
              {/* Animated wave effect */}
              <g className={animate ? "animate-pulse" : ""}>
                <path
                  d={`
                    M0,${size - (size * normalizedPercentage / 100) + waveAmplitude * Math.sin(0)}
                    ${Array.from({ length: waveFrequency }, (_, i) => {
                      const x = (i + 1) * (size / waveFrequency);
                      const y = size - (size * normalizedPercentage / 100) + 
                              waveAmplitude * Math.sin((i + 1) * Math.PI / 5);
                      return `L${x},${y}`;
                    }).join(' ')}
                    L${size},${size}
                    L0,${size}
                    Z
                  `}
                  fill={getProgressColor()}
                  opacity="0.4"
                />
              </g>
              
              {/* Shimmer effect */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius - strokeWidth / 2}
                fill="white"
                opacity="0.05"
                className="animate-pulse"
                style={{ animationDuration: "3s" }}
              />
              
              {/* Splash animation */}
              {splash && (
                <>
                  <circle
                    cx={size / 2}
                    cy={size - (size * normalizedPercentage / 100)}
                    r={radius * 0.1}
                    fill="white"
                    opacity="0.3"
                    className="animate-ping"
                    style={{ animationDuration: "0.5s" }}
                  />
                  <circle
                    cx={size / 2 + radius * 0.2}
                    cy={size - (size * normalizedPercentage / 100) - radius * 0.1}
                    r={radius * 0.05}
                    fill="white"
                    opacity="0.3"
                    className="animate-ping"
                    style={{ animationDuration: "0.7s" }}
                  />
                </>
              )}
              
              {/* Small bubbles effect */}
              {progress > 0 && (
                <>
                  <circle
                    cx={size / 2 - radius * 0.3}
                    cy={size - (size * normalizedPercentage / 100) + radius * 0.3}
                    r={radius * 0.03}
                    fill="white"
                    opacity="0.4"
                    className="animate-bounce"
                    style={{ animationDuration: "2s" }}
                  />
                  <circle
                    cx={size / 2 + radius * 0.4}
                    cy={size - (size * normalizedPercentage / 100) + radius * 0.5}
                    r={radius * 0.02}
                    fill="white"
                    opacity="0.3"
                    className="animate-bounce"
                    style={{ animationDuration: "3s" }}
                  />
                </>
              )}
            </g>
          </>
        )}
        
        {/* Progress indicator */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="ring-progress-indicator"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            stroke: getProgressColor(),
            transition: "stroke-dashoffset 0.8s ease-in-out, stroke 0.5s ease"
          }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      
      <div className="absolute flex flex-col items-center justify-center text-downscale-cream">
        <span className="text-4xl font-bold">{Math.round(progress)}%</span>
        <span className="text-sm text-downscale-cream/70">of daily goal</span>
        {normalizedPercentage > 0 && (
          <span className="text-xs mt-1 font-semibold text-downscale-blue/90 bg-downscale-blue/10 px-2 py-0.5 rounded-full">
            {getAchievementLevel()}
          </span>
        )}
      </div>
    </div>
  );
}
