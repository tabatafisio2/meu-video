import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const LINES: { text: string; accent?: boolean }[] = [
  { text: "Olá, seja bem-vinda" },
  { text: "a mais uma aula de" },
  { text: "como recuperar sua", accent: true },
  { text: "diástase", accent: true },
  { text: "em 3 passos," },
  { text: "só com 5 minutos por dia!" },
];

const STAGGER = 22;
const START = 10;

export const MyComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" },
  );
  const glow = interpolate(frame, [0, durationInFrames], [0.6, 1]);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 40%, rgba(236,72,153,${0.18 * glow}) 0%, #0b0b12 60%)`,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Helvetica, Arial, sans-serif",
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
          padding: "0 80px",
          textAlign: "center",
        }}
      >
        {LINES.map((line, i) => {
          const progress = spring({
            frame: frame - START - i * STAGGER,
            fps,
            config: { damping: 14, stiffness: 110 },
          });
          return (
            <div
              key={line.text}
              style={{
                fontSize: line.accent ? 92 : 70,
                fontWeight: line.accent ? 800 : 600,
                color: line.accent ? "#f472b6" : "#f5f5f7",
                opacity: progress,
                transform: `translateY(${(1 - progress) * 80}px) scale(${0.9 + 0.1 * progress})`,
                lineHeight: 1.15,
              }}
            >
              {line.text}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
