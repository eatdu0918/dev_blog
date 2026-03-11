'use client';

import { useEffect, useRef } from 'react';

export default function DataStructuresCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    // Handle high DPI displays for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const w = 800;
    const h = 800;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Drawing Utils
    const drawRoundRect = (x: number, y: number, width: number, height: number, r: number, bg: string | null, border: string | null, glow = 0) => {
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, width, height, r);
      } else {
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
      }
      ctx.closePath();

      if (bg) {
        ctx.fillStyle = bg;
        ctx.fill();
      }
      if (border) {
        if (glow > 0) {
          ctx.shadowBlur = glow;
          ctx.shadowColor = border;
        }
        ctx.strokeStyle = border;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      }
    };

    const drawText = (text: string, x: number, y: number, color: string, size: number, align: CanvasTextAlign = 'center', weight = '500', glow = 0) => {
      ctx.fillStyle = color;
      ctx.font = `${weight} ${size}px "Inter", "system-ui", sans-serif`;
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';
      if (glow > 0) {
        ctx.shadowBlur = glow;
        ctx.shadowColor = color;
      }
      ctx.fillText(text, x, y);
      ctx.shadowBlur = 0;
    };
    
    const drawArrow = (x1: number, y1: number, x2: number, y2: number, color: string, thickness = 2, opacity = 1) => {
        ctx.globalAlpha = opacity;
        const headlen = 10; 
        const dx = x2 - x1;
        const dy = y2 - y1;
        const angle = Math.atan2(dy, dx);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
        ctx.lineTo(x2, y2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.globalAlpha = 1;
    };

    const drawPath = (points: number[][], color: string, thickness = 2) => {
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for(let i=1; i<points.length; i++){
            ctx.lineTo(points[i][0], points[i][1]);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.stroke();
    };

    const drawCircle = (x: number, y: number, r: number, bg: string|null, border: string|null, label: string, glow = 0) => {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        if(bg) { ctx.fillStyle = bg; ctx.fill(); }
        if(border) {
            if(glow > 0) { ctx.shadowBlur = glow; ctx.shadowColor = border; }
            ctx.strokeStyle = border; ctx.lineWidth = 2; ctx.stroke();
            ctx.shadowBlur = 0;
        }
        if(label) {
            drawText(label, x, y, '#ffffff', 16, 'center', '600');
        }
    };

    // Main Render Loop
    const render = (time: number) => {
      const t = time / 1000; 

      // 1) Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, 800);
      grad.addColorStop(0, '#0a0a14'); // Very dark blue/black
      grad.addColorStop(1, '#111827'); // Slate 900
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 800);

      // 2) Grid Pattern for a technical "blueprint" feel
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 800; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 800); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(800, i); ctx.stroke();
      }

      // 3) Title & Main Separators
      drawText('MODERN DATA STRUCTURES', 400, 50, '#e2e8f0', 26, 'center', '800', 10);
      
      // Separator lines (Cross pattern)
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)'; 
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(400, 90); ctx.lineTo(400, 750);
      ctx.moveTo(50, 400); ctx.lineTo(750, 400);
      ctx.stroke();
      ctx.setLineDash([]);


      // ==========================================
      // (1) STACK (LIFO)
      // ==========================================
      drawText('1. STACK', 60, 120, '#f8fafc', 20, 'left', '700');
      drawRoundRect(160, 105, 50, 26, 6, 'rgba(249, 115, 22, 0.1)', '#f97316', 5);
      drawText('LIFO', 185, 118, '#f97316', 12, 'center', '600');

      // Container
      drawPath([[170, 160], [170, 360], [250, 360], [250, 160]], '#38bdf8', 3);
      
      const stackPhase = (t % 4); 
      // Static elements D, C, B
      drawRoundRect(180, 310, 60, 40, 6, 'rgba(249, 115, 22, 0.8)', null); drawText('D', 210, 330, '#fff', 18, 'center', '700');
      drawRoundRect(180, 260, 60, 40, 6, 'rgba(245, 158, 11, 0.8)', null); drawText('C', 210, 280, '#fff', 18, 'center', '700');
      drawRoundRect(180, 210, 60, 40, 6, 'rgba(252, 211, 77, 0.8)', null); drawText('B', 210, 230, '#fff', 18, 'center', '700');

      if (stackPhase < 2) {
        // Push A
        const progress = Math.min(1, stackPhase * 1.5); // Speed up motion
        const ease = 1 - Math.pow(1 - progress, 3);
        const yPos = 80 + (ease * 80);
        
        drawArrow(130, 120, 180, Math.min(yPos, 160), '#4ade80', 2, Math.min(1, progress * 3));
        drawText('PUSH (A)', 100, 120, '#4ade80', 14, 'left', '500', 5);
        
        drawRoundRect(180, yPos, 60, 40, 6, `rgba(74, 222, 128, ${progress})`, '#4ade80', 10);
        drawText('A', 210, yPos + 20, `rgba(255,255,255,${progress})`, 18, 'center', '700');
      } else {
        // Pop A
        const progress = Math.min(1, (stackPhase - 2) * 1.5);
        const ease = 1 - Math.pow(1 - progress, 3);
        const xPos = 180 + (ease * 70);
        const yPos = 160 - (ease * 40);
        const alpha = 1 - progress;

        drawArrow(220, 160, 280, 100, '#a855f7', 2, alpha);
        if(alpha > 0.1) drawText('POP (A)', 290, 100, '#a855f7', 14, 'left', '500', 5);
        
        ctx.globalAlpha = alpha;
        drawRoundRect(xPos, yPos, 60, 40, 6, 'rgba(74, 222, 128, 0.8)', '#4ade80', 10);
        drawText('A', xPos + 30, yPos + 20, '#fff', 18, 'center', '700');
        ctx.globalAlpha = 1.0;
      }


      // ==========================================
      // (2) QUEUE (FIFO)
      // ==========================================
      drawText('2. QUEUE', 460, 120, '#f8fafc', 20, 'left', '700');
      drawRoundRect(580, 105, 50, 26, 6, 'rgba(56, 189, 248, 0.1)', '#38bdf8', 5);
      drawText('FIFO', 605, 118, '#38bdf8', 12, 'center', '600');

      // Container
      drawPath([[480, 220], [740, 220]], '#4ade80', 2);
      drawPath([[480, 280], [740, 280]], '#4ade80', 2);
      drawText('HEAD', 500, 205, '#94a3b8', 12, 'center');
      drawText('TAIL', 720, 205, '#94a3b8', 12, 'center');

      const qPhase = t % 4;
      
      // Static nodes Y, Z
      drawRoundRect(550, 230, 40, 40, 6, 'rgba(45, 212, 191, 0.8)', null); drawText('Y', 570, 250, '#fff', 18, 'center', '700');
      drawArrow(595, 250, 605, 250, '#cbd5e1');
      drawRoundRect(610, 230, 40, 40, 6, 'rgba(167, 139, 250, 0.8)', null); drawText('Z', 630, 250, '#fff', 18, 'center', '700');
      
      if (qPhase < 2) {
        // Enqueue W
        const progress = Math.min(1, qPhase * 1.5);
        const ease = 1 - Math.pow(1 - progress, 3);
        const xIn = 750 - (ease * 80);

        drawArrow(760, 150, 690, 220, '#4ade80', 2, progress);
        drawText('ENQUEUE(W)', 750, 140, '#4ade80', 12, 'center', '600', 5);
        
        ctx.globalAlpha = progress;
        drawArrow(655, 250, 665, 250, '#cbd5e1');
        drawRoundRect(xIn, 230, 40, 40, 6, 'rgba(244, 114, 182, 0.8)', '#f472b6', 10); 
        drawText('W', xIn + 20, 250, '#fff', 18, 'center', '700');
        ctx.globalAlpha = 1;

        // X is static
        drawRoundRect(490, 230, 40, 40, 6, 'rgba(56, 189, 248, 0.8)', null); drawText('X', 510, 250, '#fff', 18, 'center', '700');
        drawArrow(535, 250, 545, 250, '#cbd5e1');
      } else {
        // Dequeue X
        const progress = Math.min(1, (qPhase - 2) * 1.5);
        const ease = 1 - Math.pow(1 - progress, 3);
        
        // W is static
        drawArrow(655, 250, 665, 250, '#cbd5e1');
        drawRoundRect(670, 230, 40, 40, 6, 'rgba(244, 114, 182, 0.8)', null); drawText('W', 690, 250, '#fff', 18, 'center', '700');

        // X leaving
        const xPos = 490 - ease * 60;
        const yPos = 230 + ease * 30;
        const alpha = 1 - progress;

        drawArrow(500, 260, 440, 310, '#f97316', 2, alpha);
        if(alpha > 0.1) drawText('DEQUEUE(X)', 450, 325, '#f97316', 12, 'center', '600', 5);
        
        ctx.globalAlpha = alpha;
        drawRoundRect(xPos, yPos, 40, 40, 6, 'rgba(56, 189, 248, 0.8)', '#38bdf8', 10); 
        drawText('X', xPos + 20, yPos + 20, '#fff', 18, 'center', '700');
        ctx.globalAlpha = 1.0;
        if(alpha > 0) drawArrow(xPos + 45, yPos + 20, 545, 250, '#cbd5e1');
      }


      // ==========================================
      // (3) DEQUE
      // ==========================================
      drawText('3. DEQUE', 60, 440, '#f8fafc', 20, 'left', '700');
      drawText('(Double-Ended Queue)', 165, 440, '#94a3b8', 14, 'left');
      
      drawPath([[120, 560], [330, 560]], '#a855f7', 2);
      drawPath([[120, 620], [330, 620]], '#a855f7', 2);
      drawText('FRONT', 90, 590, '#c084fc', 14, 'center');
      drawText('BACK', 360, 590, '#c084fc', 14, 'center');

      const dColors = ['rgba(56,189,248,0.8)', 'rgba(74,222,128,0.8)', 'rgba(250,204,21,0.8)', 'rgba(244,114,182,0.8)'];
      ['F1', 'F2', 'F3', 'F4'].forEach((lbl, i) => {
         drawRoundRect(130 + i*50, 570, 40, 40, 6, dColors[i], null);
         drawText(lbl, 150 + i*50, 590, '#fff', 14, 'center', '700');
         if(i < 3) drawArrow(175+i*50, 590, 180+i*50, 590, '#cbd5e1', 1);
      });

      const glow = (Math.sin(t * Math.PI) + 1) / 2; 

      drawArrow(80, 490, 120, 550, '#38bdf8', 2, 0.4 + glow*0.6); drawText('PUSH_FRONT', 100, 475, '#38bdf8', 12, 'center', '600', glow*5);
      drawArrow(130, 630, 90, 690, '#f97316', 2, 0.4 + glow*0.6); drawText('POP_FRONT', 100, 705, '#f97316', 12, 'center', '600', glow*5);
      
      drawArrow(370, 490, 330, 550, '#38bdf8', 2, 0.4 + glow*0.6); drawText('PUSH_BACK', 350, 475, '#38bdf8', 12, 'center', '600', glow*5);
      drawArrow(320, 630, 360, 690, '#f97316', 2, 0.4 + glow*0.6); drawText('POP_BACK', 350, 705, '#f97316', 12, 'center', '600', glow*5);


      // ==========================================
      // (4) HEAP
      // ==========================================
      drawText('4. HEAP', 460, 440, '#f8fafc', 20, 'left', '700');
      drawText('(Max-Priority Tree)', 550, 440, '#94a3b8', 14, 'left');

      const tLines = [
        [600, 520, 530, 600],
        [600, 520, 670, 600],
        [530, 600, 490, 670],
        [530, 600, 570, 670],
        [670, 600, 630, 670],
        [670, 600, 710, 670],
        [490, 670, 460, 740],
        [490, 670, 520, 740],
      ];
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      tLines.forEach(([x1, y1, x2, y2]) => {
         ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      });

      const hNodes = [
        [600, 520, '90', 'rgba(249,115,22,0.8)', '#f97316'], 
        [530, 600, '75', 'rgba(56,189,248,0.8)', null],
        [670, 600, '80', 'rgba(74,222,128,0.8)', null],
        [490, 670, '60', 'rgba(168,85,247,0.8)', null],
        [570, 670, '50', 'rgba(168,85,247,0.8)', null],
        [630, 670, '70', 'rgba(236,72,153,0.8)', null],
        [710, 670, '40', 'rgba(236,72,153,0.8)', null],
        [460, 740, '10', 'rgba(100,116,139,0.8)', null],
        [520, 740, '30', 'rgba(100,116,139,0.8)', null],
      ];

      hNodes.forEach(([x, y, v, bg, border]) => {
         drawCircle(x as number, y as number, 22, bg as string, border as string, v as string, border ? 15 : 0);
      });

      const hGlow = Math.max(0, Math.sin(t * 3));
      if (hGlow > 0) {
        drawCircle(600, 520, 28, null, `rgba(249, 115, 22, ${hGlow})`, '', hGlow * 15);
        drawArrow(635, 520, 680, 500, '#f97316', 2, hGlow);
        drawText('EXTRACT (90)', 725, 490, `rgba(249, 115, 22, ${hGlow})`, 12, 'center', '600', hGlow*10);
      }

      drawText('MAX HEAP PROPERTY:', 460, 500, '#94a3b8', 12, 'left');
      drawText('Parent >= Children', 460, 515, '#4ade80', 12, 'left', '600');

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="w-full flex justify-center py-10 not-prose">
      <div 
        className="relative w-full max-w-[800px] aspect-square rounded-xl overflow-hidden shadow-2xl border border-white/10"
        style={{ background: '#0a0a14' }}
      >
        <canvas
          ref={canvasRef}
          width={800}
          height={800}
          className="w-full h-full block"
        />
        {/* Adds a slight inner shadow for premium feel */}
        <div className="absolute inset-0 rounded-xl pointer-events-none shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] border border-white/5 mix-blend-overlay"></div>
      </div>
    </div>
  );
}
