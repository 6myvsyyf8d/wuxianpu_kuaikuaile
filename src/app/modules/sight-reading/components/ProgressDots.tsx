interface ProgressDotsProps {
  total: number;
  current: number;
  correct: number;
  wrong: number;
}

export function ProgressDots({ total, current, correct, wrong }: ProgressDotsProps) {
  return (
    <div className="flex gap-1.5 items-center">
      {Array.from({ length: total }).map((_, i) => {
        const state =
          i < correct ? "correct"
          : i < correct + wrong ? "wrong"
          : i < current ? "done"
          : "pending";
        return (
          <div
            key={i}
            className="rounded-full transition-all"
            style={{
              width: i === current ? 20 : 10,
              height: 10,
              background:
                state === "correct" ? "#16A34A"
                : state === "wrong" ? "#DC2626"
                : state === "done" ? "#94A3B8"
                : "#E2E8F0",
            }}
          />
        );
      })}
    </div>
  );
}
