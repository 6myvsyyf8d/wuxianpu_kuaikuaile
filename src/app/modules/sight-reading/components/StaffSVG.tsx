import { motion, AnimatePresence } from "motion/react";
import { LINE_YS, SL, SR, NX, noteY, NoteData, FeedbackState, ClefType } from "../types";

interface StaffSVGProps {
  note: NoteData | null;
  feedback: FeedbackState;
  clef: ClefType;
  isChord?: boolean;
  chordNotes?: NoteData[];
}

export function StaffSVG({ note, feedback, clef, isChord, chordNotes }: StaffSVGProps) {
  const renderChord = isChord && chordNotes && chordNotes.length > 0;
  const notes = renderChord ? chordNotes! : note ? [note] : [];

  // Sort by step ascending (lowest pitch first)
  const sorted = [...notes].sort((a, b) => a.step - b.step);

  // Stem direction: use middle note for chords, or the single note
  const middleNote = sorted[Math.floor(sorted.length / 2)];
  const stemUp = middleNote ? middleNote.step < 4 : true;

  const noteFill =
    feedback === "correct" ? "#16A34A"
    : feedback === "wrong" || feedback === "timeout" ? "#DC2626"
    : "#1E293B";

  // Compute ledger lines — deduplicate across chord notes
  const ledgerYs: number[] = [];
  const addedLedger = new Set<number>();
  for (const n of notes) {
    const minStep = clef === "treble" ? -2 : -4;
    const maxStep = 10;
    for (let s = minStep; s >= n.step; s -= 2) {
      if (s !== n.step || s === minStep) {
        if (s < 0 || s > 8) {
          const y = noteY(s);
          if (!addedLedger.has(y)) {
            addedLedger.add(y);
            ledgerYs.push(y);
          }
        }
      }
    }
    for (let s = maxStep; s <= n.step; s += 2) {
      if (s > 8) {
        const y = noteY(s);
        if (!addedLedger.has(y)) {
          addedLedger.add(y);
          ledgerYs.push(y);
        }
      }
    }
  }
  ledgerYs.sort((a, b) => a - b);

  // Position of the topmost note for feedback overlay placement
  const topY = sorted.length > 0 ? noteY(sorted[0].step) : null;

  return (
    <svg
      viewBox="0 0 560 310"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "90%", height: "auto", maxWidth: "90%", overflow: "hidden", margin: "0 auto", display: "block" }}
    >
      {/* Staff lines */}
      {LINE_YS.map((y, i) => (
        <line key={i} x1={SL} y1={y} x2={SR} y2={y} stroke="#374151" strokeWidth="2.5" />
      ))}

      {/* Clef */}
      {clef === "treble" ? (
        <text
          x={105} y={242}
          fontSize={309}
          fontFamily="'Times New Roman', 'Georgia', serif"
          fill="#4B5563"
          style={{ userSelect: "none" }}
        >
          𝄞
        </text>
      ) : (
        <text
          x={108} y={200}
          fontSize={206}
          fontFamily="'Times New Roman', 'Georgia', serif"
          fill="#4B5563"
          style={{ userSelect: "none" }}
        >
          𝄢
        </text>
      )}

      {/* Opening barline */}
      <line x1={SL} y1={60} x2={SL} y2={220} stroke="#374151" strokeWidth="2.5" />

      {/* Ledger lines */}
      {ledgerYs.map((y, i) => (
        <line key={i} x1={NX - 33} y1={y} x2={NX + 33} y2={y} stroke="#374151" strokeWidth="2.5" />
      ))}

      {/* Notes */}
      <AnimatePresence mode="wait">
        {notes.length > 0 && (
          <motion.g
            key={notes.map(n => n.id).join("-") + feedback}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
          >
            {/* Stem */}
            {renderChord ? (
              sorted.length === 3 ? (
                stemUp ? (
                  <line
                    x1={NX + 17} y1={noteY(sorted[2].step) + 13}
                    x2={NX + 17} y2={noteY(sorted[0].step) - 60}
                    stroke={noteFill} strokeWidth="3.5" strokeLinecap="round"
                  />
                ) : (
                  <line
                    x1={NX - 17} y1={noteY(sorted[0].step) - 13}
                    x2={NX - 17} y2={noteY(sorted[2].step) + 60}
                    stroke={noteFill} strokeWidth="3.5" strokeLinecap="round"
                  />
                )
              ) : (
                // Fallback: single stem through all note centers
                <line
                  x1={NX + 17} y1={noteY(sorted[sorted.length - 1].step)}
                  x2={NX + 17} y2={noteY(sorted[0].step) - 72}
                  stroke={noteFill} strokeWidth="3.5" strokeLinecap="round"
                />
              )
            ) : (
              stemUp ? (
                <line
                  x1={NX + 17} y1={noteY(sorted[0].step)}
                  x2={NX + 17} y2={noteY(sorted[0].step) - 72}
                  stroke={noteFill} strokeWidth="3.5" strokeLinecap="round"
                />
              ) : (
                <line
                  x1={NX - 17} y1={noteY(sorted[0].step)}
                  x2={NX - 17} y2={noteY(sorted[0].step) + 72}
                  stroke={noteFill} strokeWidth="3.5" strokeLinecap="round"
                />
              )
            )}

            {/* Note heads */}
            {sorted.map((n) => (
              <ellipse
                key={n.id}
                cx={NX} cy={noteY(n.step)}
                rx={18} ry={13}
                fill={noteFill}
                transform={`rotate(-15, ${NX}, ${noteY(n.step)})`}
              />
            ))}

            {/* Feedback overlay */}
            {feedback === "correct" && topY !== null && (
              <motion.text
                x={NX + 26} y={topY + 5}
                fontSize="30" fill="#16A34A" fontWeight="bold"
                initial={{ opacity: 0, y: topY + 20 }}
                animate={{ opacity: 1, y: topY + 5 }}
                transition={{ delay: 0.05 }}
              >
                ✓
              </motion.text>
            )}
            {(feedback === "wrong" || feedback === "timeout") && topY !== null && (
              <motion.text
                x={NX + 26} y={topY + 5}
                fontSize="30" fill="#DC2626" fontWeight="bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                ✗
              </motion.text>
            )}
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  );
}
