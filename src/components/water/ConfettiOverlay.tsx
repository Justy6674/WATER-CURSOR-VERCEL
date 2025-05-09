
import { useState, useEffect } from "react";

interface ConfettiOverlayProps {
  show: boolean;
  onComplete?: () => void;
}

export function ConfettiOverlay({ show, onComplete }: ConfettiOverlayProps) {
  const [confetti, setConfetti] = useState<{ x: number; y: number; size: number; color: string; angle: number; speed: number }[]>([]);
  const [audio] = useState<HTMLAudioElement | null>(typeof window !== 'undefined' ? new Audio('/achievement-sound.mp3') : null);

  useEffect(() => {
    if (show) {
      // Play celebration sound
      if (audio) {
        audio.volume = 0.3;
        audio.currentTime = 0;
        audio.play().catch(e => console.log("Audio play error:", e));
      }
      
      // Generate confetti particles
      const particles = [];
      const colors = ['#5271ff', '#60a5fa', '#10b981', '#b68a71', '#f7f2d3', '#f59e0b'];
      
      for (let i = 0; i < 150; i++) { // Increased particle count for more festive effect
        particles.push({
          x: Math.random() * 100,
          y: Math.random() * 50 - 50,
          size: Math.random() * 10 + 2, // Larger confetti pieces
          color: colors[Math.floor(Math.random() * colors.length)],
          angle: Math.random() * 90 + 45,
          speed: Math.random() * 2 + 1
        });
      }
      
      setConfetti(particles);
      
      // Clean up confetti after animation
      const timer = setTimeout(() => {
        setConfetti([]);
        if (onComplete) onComplete();
      }, 6000); // Longer celebration time
      
      return () => clearTimeout(timer);
    }
  }, [show, audio, onComplete]);

  if (!show && confetti.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confetti.map((particle, i) => (
        <div
          key={i}
          className="absolute rounded-md animate-confetti"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size * 1.5}px`,
            backgroundColor: particle.color,
            transform: `rotate(${particle.angle}deg)`,
            animation: `fall ${5 / particle.speed}s linear forwards`
          }}
        />
      ))}
      
      {/* Center celebration text */}
      {show && (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10">
          <div className="bg-downscale-blue/30 backdrop-blur-sm p-4 rounded-lg animate-bounce">
            <h2 className="text-3xl font-bold text-white mb-2 shadow-text">Goal Reached!</h2>
            <p className="text-xl text-white shadow-text">Great job staying hydrated today!</p>
          </div>
        </div>
      )}
    </div>
  );
}
