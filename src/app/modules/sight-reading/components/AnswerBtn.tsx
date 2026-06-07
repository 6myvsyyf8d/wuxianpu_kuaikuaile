import { motion } from "motion/react";
import { NOTE_COLORS, SOLFEGE, NoteName } from "../types";

interface AnswerBtnProps {
  name: NoteName;
  label?: string;
  disabled: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  onClick: () => void;
  color?: { bg: string; shadow: string; text: string };
  index?: number;
}

export function AnswerBtn({
  name,
  label,
  disabled,
  isCorrect,
  isWrong,
  onClick,
  color,
  index = 0,
}: AnswerBtnProps) {
  const col = color ?? NOTE_COLORS[name];
  const bg = isCorrect ? "#16A34A" : isWrong ? "#DC2626" : col.bg;
  const shadow = isCorrect ? "#0F5132" : isWrong ? "#7F1D1D" : col.shadow;

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.94 }}
      whileHover={disabled ? {} : { scale: 1.02, y: -2 }}
      initial={{ opacity: 0, scale: 0.8, y: 15 }}
      animate={{
        opacity: disabled && !isCorrect && !isWrong ? 0.55 : 1,
        scale: 1,
        y: 0,
        x: isWrong ? [0, -10, 10, -8, 8, 0] : 0,
      }}
      transition={{
        duration: isWrong ? 0.4 : 0.3,
        delay: index * 0.08,
        ease: "easeOut",
      }}
      className="flex flex-col items-center justify-center rounded-2xl select-none w-full"
      style={{
        background: `linear-gradient(160deg, ${bg} 0%, ${shadow} 100%)`,
        boxShadow: `0 4px 0 ${shadow}, 0 6px 16px ${bg}44`,
        color: col.text,
        border: "none",
        cursor: disabled ? "default" : "pointer",
        minHeight: 72,
        aspectRatio: "1 / 1.05",
      }}
    >
      <span style={{ fontSize: "clamp(18px, 4.5vw, 32px)", fontWeight: 800, letterSpacing: -0.5 }}>{name}</span>
      <span style={{ fontSize: "clamp(10px, 2.2vw, 14px)", opacity: 0.85, fontWeight: 600, marginTop: 2 }}>
        {label ?? SOLFEGE[name]}
      </span>
    </motion.button>
  );
}
