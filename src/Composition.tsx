import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Tone = "pink" | "gold";
type Word = { text: string; strong?: Tone; size?: number };

const LINES: Word[][] = [
  [{ text: "Olá, seja bem-vinda" }],
  [{ text: "a mais uma aula de" }],
  [
    { text: "como" },
    { text: "recuperar", strong: "pink" },
    { text: "sua" },
  ],
  [{ text: "diástase", strong: "pink", size: 130 }],
  [{ text: "em" }, { text: "3 passos", strong: "gold" }],
  [
    { text: "só com" },
    { text: "5 minutos", strong: "gold" },
    { text: "por dia!" },
  ],
];

const COLORS: Record<Tone, { fill: string; glow: string }> = {
  pink: { fill: "#ff5fa8", glow: "255,95,168" },
  gold: { fill: "#ffc83d", glow: "255,200,61" },
};

const STAGGER = 24;
const START = 10;
const BASE_SIZE = 70;

const StrongWord: React.FC<{ word: Word; appearAt: number }> = ({
  word,
  appearAt,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone = COLORS[word.strong!];
  const t = frame - appearAt;

  // Impact: overshoots well past 1 and wobbles back (low damping).
  const pop = spring({
    frame: t,
    fps,
    config: { damping: 6, stiffness: 170, mass: 0.7 },
  });
  const scale = interpolate(pop, [0, 1], [0.4, 1.12]);
  const tilt = interpolate(pop, [0, 0.6, 1], [-8, 3, 0]);

  // Quick shake right on impact.
  const shake = t >= 0 && t < 12 ? Math.sin(t * 2.4) * (1 - t / 12) * 9 : 0;

  // Flash on impact + sustained breathing glow afterwards.
  const flash = interpolate(t, [0, 14], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const breathe = t > 14 ? 0.5 + 0.5 * Math.sin((t - 14) / 7) : 0;
  const glowPx = 20 + 40 * flash + 18 * breathe;
  const glowA = 0.55 + 0.4 * flash + 0.15 * breathe;

  // Underline sweeps in after the pop.
  const underline = interpolate(t, [8, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        fontWeight: 900,
        fontSize: word.size ?? BASE_SIZE,
        color: tone.fill,
        transform: `translateX(${shake}px) rotate(${tilt}deg) scale(${scale})`,
        textShadow: `0 0 ${glowPx}px rgba(${tone.glow},${glowA})`,
        whiteSpace: "pre",
      }}
    >
      {word.text}
      <span
        style={{
          position: "absolute",
          left: 0,
          bottom: -6,
          height: 8,
          borderRadius: 4,
          width: `${underline * 100}%`,
          background: tone.fill,
          boxShadow: `0 0 18px rgba(${tone.glow},0.8)`,
        }}
      />
    </span>
  );
};

export const MyComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" },
  );

  // Background pulses each time a strong word lands.
  const hits = LINES.flatMap((line, i) =>
    line.some((w) => w.strong) ? [START + i * STAGGER + 4] : [],
  );
  const pulse = hits.reduce((acc, h) => {
    const d = frame - h;
    return acc + (d >= 0 ? Math.exp(-d / 8) : 0);
  }, 0);
  const glow = 0.55 + Math.min(pulse, 1) * 0.5;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 42%, rgba(236,72,153,${0.2 * glow}) 0%, #0b0b12 62%)`,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Helvetica, Arial, sans-serif",
        opacity: fadeOut,
      }}
    >
      {LINES.map((line, i) => {
        const lineStart = START + i * STAGGER;
        return (
          <Sequence key={`sfx-${i}`} from={lineStart} layout="none">
            <Audio src={staticFile("sfx/whoosh.wav")} volume={0.35} />
            {line.some((w) => w.strong) ? (
              <Sequence from={4} layout="none">
                <Audio src={staticFile("sfx/impact.wav")} volume={0.9} />
              </Sequence>
            ) : null}
          </Sequence>
        );
      })}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 34,
          padding: "0 50px",
          textAlign: "center",
        }}
      >
        {LINES.map((line, i) => {
          const lineStart = START + i * STAGGER;
          const progress = spring({
            frame: frame - lineStart,
            fps,
            config: { damping: 14, stiffness: 110 },
          });
          return (
            <div
              key={i}
              style={{
                fontSize: BASE_SIZE,
                fontWeight: 600,
                color: "#f5f5f7",
                opacity: progress,
                transform: `translateY(${(1 - progress) * 80}px)`,
                lineHeight: 1.15,
                display: "flex",
                justifyContent: "center",
                alignItems: "baseline",
                columnGap: 48,
              }}
            >
              {line.map((w, j) =>
                w.strong ? (
                  <StrongWord key={j} word={w} appearAt={lineStart + 4} />
                ) : (
                  <span key={j}>{w.text}</span>
                ),
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
