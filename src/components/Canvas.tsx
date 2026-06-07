import { useEffect, useRef, useState } from "react";
import { Trash2, Edit2, Eraser } from "lucide-react";

export interface StrokePoint {
  x: number; // Normalized coordinate 0.0 to 1.0
  y: number; // Normalized coordinate 0.0 to 1.0
}

export interface CanvasStroke {
  points: StrokePoint[];
  color: string;
  width: number;
}

interface CanvasProps {
  strokes: CanvasStroke[];
  isDrawer: boolean;
  onStrokesChange: (newStrokes: CanvasStroke[]) => void;
}

const PRESET_COLORS = [
  "#ffffff", // White
  "#ff4757", // Hot Coral
  "#f5a623", // Neon Amber
  "#2ecc71", // Green Neon
  "#00d2d3", // Cyan Neon
  "#a55eea", // Purple Violet
  "#ff9ff3", // Pink
  "#ff9f43"  // Orange
];

export function Canvas({ strokes = [], isDrawer, onStrokesChange }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [color, setColor] = useState<string>("#ffffff");
  const [lineWidth, setLineWidth] = useState<number>(5);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 400, height: 300 });

  const currentStrokeRef = useRef<StrokePoint[]>([]);

  // 1. Resize observer to handle dynamic scaling
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;

      const canvas = canvasRef.current;
      if (canvas) {
        // Match canvas layout width/height
        canvas.width = width;
        canvas.height = height;
        setDimensions({ width, height });
        
        // Re-draw canvas on resize
        redrawCanvas(strokes, width, height);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [strokes]);

  // Redraw all strokes on canvas resize or strokes update
  const redrawCanvas = (strokesList: CanvasStroke[], w: number, h: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear and draw night-market dark bg
    ctx.fillStyle = "#0f0f1a";
    ctx.fillRect(0, 0, w, h);

    // Draw coordinate dots to give a retro grid paper vibe
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    const dotSpacing = 30;
    for (let x = 15; x < w; x += dotSpacing) {
      for (let y = 15; y < h; y += dotSpacing) {
        ctx.fillRect(x, y, 2, 2);
      }
    }

    // Draw all completed strokes
    strokesList.forEach((stroke) => {
      if (!stroke.points || stroke.points.length === 0) return;

      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const start = stroke.points[0];
      ctx.moveTo(start.x * w, start.y * h);

      for (let i = 1; i < stroke.points.length; i++) {
        const pt = stroke.points[i];
        ctx.lineTo(pt.x * w, pt.y * h);
      }
      ctx.stroke();
    });
  };

  useEffect(() => {
    redrawCanvas(strokes, dimensions.width, dimensions.height);
  }, [strokes, dimensions]);

  // Normalized utility mapping coordinates from screen client to 0.0-1.0 bounding rect
  const getNormalizedCoordinates = (clientX: number, clientY: number): StrokePoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    // Restrict within boundary coordinates
    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    };
  };

  // 2. Event Handlers
  const handleStart = (clientX: number, clientY: number) => {
    if (!isDrawer) return;
    setIsDrawing(true);

    const pt = getNormalizedCoordinates(clientX, clientY);
    if (pt) {
      currentStrokeRef.current = [pt];
      
      // Draw point immediately locally for snappy feelings
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx && canvas) {
        ctx.beginPath();
        ctx.arc(pt.x * canvas.width, pt.y * canvas.height, (tool === "eraser" ? 15 : lineWidth) / 2, 0, Math.PI * 2);
        ctx.fillStyle = tool === "eraser" ? "#0f0f1a" : color;
        ctx.fill();
      }
    }
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDrawer || !isDrawing) return;

    const pt = getNormalizedCoordinates(clientX, clientY);
    if (pt && currentStrokeRef.current.length > 0) {
      const lastPt = currentStrokeRef.current[currentStrokeRef.current.length - 1];
      currentStrokeRef.current.push(pt);

      // Simple trace directly on local view for lag-free visual feedbacks!
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx && canvas) {
        ctx.beginPath();
        ctx.strokeStyle = tool === "eraser" ? "#0f0f1a" : color;
        ctx.lineWidth = tool === "eraser" ? 25 : lineWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.moveTo(lastPt.x * canvas.width, lastPt.y * canvas.height);
        ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
        ctx.stroke();
      }
    }
  };

  const handleEnd = () => {
    if (!isDrawer || !isDrawing) return;
    setIsDrawing(false);

    if (currentStrokeRef.current.length > 0) {
      const nextStroke: CanvasStroke = {
        points: [...currentStrokeRef.current],
        color: tool === "eraser" ? "#0f0f1a" : color,
        width: tool === "eraser" ? 25 : lineWidth,
      };

      onStrokesChange([...strokes, nextStroke]);
    }
    currentStrokeRef.current = [];
  };

  // Actions
  const clearCanvas = () => {
    if (!isDrawer) return;
    onStrokesChange([]);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Drawer Controls panel */}
      {isDrawer && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900 border border-slate-700 rounded-lg">
          {/* Tool selectors */}
          <div className="flex items-center gap-1">
            <button
              id="tool_pen_button"
              type="button"
              onClick={() => setTool("pen")}
              className={`p-2 rounded-md border transition-all cursor-pointer ${
                tool === "pen"
                  ? "bg-[#f5a623] text-black border-[#f5a623] shadow-[0_0_8px_rgba(245,166,35,0.4)]"
                  : "bg-slate-800 text-gray-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              id="tool_eraser_button"
              type="button"
              onClick={() => setTool("eraser")}
              className={`p-2 rounded-md border transition-all cursor-pointer ${
                tool === "eraser"
                  ? "bg-[#ff4757] text-white border-[#ff4757] shadow-[0_0_8px_rgba(255,71,87,0.4)]"
                  : "bg-slate-800 text-gray-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          {/* Color Palletes */}
          {tool === "pen" && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {PRESET_COLORS.map((c) => (
                <button
                  id={`color_${c.replace("#", "")}`}
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                    color === c 
                      ? "border-amber-400 scale-125 ring-2 ring-amber-400/30" 
                      : "border-slate-800 scale-100 hover:scale-110"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Line thick panel */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">粗細:</span>
            <input
              id="stroke_width_slider"
              type="range"
              min="2"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-20 md:w-28 Accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Clear board */}
          <button
            id="clear_canvas_button"
            type="button"
            onClick={clearCanvas}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-slate-800 border border-slate-700 rounded-md hover:bg-[#ff4757] hover:border-[#ff4757] transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            清除大畫布
          </button>
        </div>
      )}

      {/* Canvas container box */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border-2 border-slate-700 bg-[#0f0f1a] shadow-inner cursor-crosshair select-none touch-none"
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => {
          if (e.touches[0]) handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchMove={(e) => {
          if (e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchEnd={handleEnd}
      >
        <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
        
        {/* Guest draw blocker/alert */}
        {!isDrawer && (
          <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 text-[11px] text-gray-300 font-mono tracking-wide px-3 py-1 rounded-full z-10 pointer-events-none">
            🎨 觀賞中... 畫家繪圖同步中
          </div>
        )}
      </div>
    </div>
  );
}
