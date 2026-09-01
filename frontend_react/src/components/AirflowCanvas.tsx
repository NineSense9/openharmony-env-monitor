import React, { useEffect, useRef } from 'react';

interface AirflowCanvasProps {
  isRunning: boolean;
  isAlarm: boolean;
}

export const AirflowCanvas: React.FC<AirflowCanvasProps> = ({ isRunning, isAlarm }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = canvas.width = canvas.parentElement?.clientWidth || 600;
    let height = canvas.height = canvas.parentElement?.clientHeight || 300;

    const handleResize = () => {
      if (canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = canvas.parentElement.clientHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: -(Math.random() * 1.5 + 0.5),
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 0.8,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const speedMult = isRunning ? 2.8 : 0.6;

      particles.forEach(p => {
        p.x += p.vx * speedMult;
        p.y += p.vy;

        if (p.x < 30) {
          p.x = width - 30;
          p.y = Math.random() * height;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = isAlarm 
          ? 'rgba(244, 63, 94, 0.45)' 
          : isRunning 
            ? 'rgba(16, 185, 129, 0.55)' 
            : 'rgba(0, 240, 255, 0.25)';
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isRunning, isAlarm]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none w-full h-full z-0" />;
};
