import { motion } from "motion/react";

interface TimerBarProps {
  timeRemaining: number;
  timeLimit: number;
}

export function TimerBar({ timeRemaining, timeLimit }: TimerBarProps) {
  const pct = Math.max(0, Math.min(100, (timeRemaining / timeLimit) * 100));
  const isCritical = timeRemaining <= 3;

  const barColor =
    pct > 50 ? "#16A34A"
    : pct > 25 ? "#F59E0B"
    : "#DC2626";

  return (
    <div className="relative w-full h-9 bg-gray-200 rounded-full overflow-hidden">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          background: `linear-gradient(180deg, ${barColor} 0%, ${barColor}CC 100%)`,
        }}
        animate={{
          width: `${pct}%`,
          ...(isCritical
            ? { scaleY: [1, 1.08, 1, 1.08, 1, 1.08, 1] }
            : { scaleY: 1 }),
        }}
        transition={{
          width: { type: "tween", duration: 0.4, ease: "easeOut" },
          scaleY: isCritical
            ? { repeat: Infinity, duration: 0.8, ease: "easeInOut" }
            : {},
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-sm font-bold select-none"
          style={{ color: pct > 30 ? "#1E293B" : "#fff" }}
        >
          {Math.ceil(timeRemaining)}秒
        </span>
      </div>
    </div>
  );
}
