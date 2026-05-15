// Random watcher avatars for the "padis viewing" indicator on the errand
// detail page. Deterministic given the seed + index, so the stack stays
// stable until the parent shifts to a new bucket. Pure visual — there is
// no real per-viewer tracking behind this.

type Palette = { bg: string; fg: string };

const PALETTE: Palette[] = [
  { bg: "var(--color-signal)", fg: "var(--color-signal-ink)" },
  { bg: "var(--color-ok)", fg: "var(--color-bg)" },
  { bg: "var(--color-warn)", fg: "var(--color-bg)" },
  { bg: "var(--color-text)", fg: "var(--color-bg)" },
  { bg: "var(--color-bg-3)", fg: "var(--color-text)" },
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return Math.abs(h);
}

function initialsFor(seed: string): string {
  const h = hash(seed);
  const a = ALPHABET[h % ALPHABET.length];
  const b = ALPHABET[Math.floor(h / 37) % ALPHABET.length];
  return `${a}${b}`;
}

function colorFor(seed: string): Palette {
  return PALETTE[hash(seed) % PALETTE.length];
}

export default function WatcherStack({
  count,
  seed,
  max = 4,
  size = 22,
}: {
  count: number;
  seed: string;
  max?: number;
  size?: number;
}) {
  if (count <= 0) return null;
  const visible = Math.min(count, max);
  const overflow = count - visible;

  return (
    <span
      className="inline-flex items-center"
      title={`${count} ${count === 1 ? "padi" : "padis"} watching this errand right now (approximate).`}
    >
      <span className="inline-flex items-center">
        {Array.from({ length: visible }).map((_, i) => {
          const s = `${seed}:${i}`;
          const initials = initialsFor(s);
          const palette = colorFor(s);
          return (
            <span
              key={i}
              aria-hidden
              className="inline-flex items-center justify-center rounded-full mono"
              style={{
                width: size,
                height: size,
                background: palette.bg,
                color: palette.fg,
                fontSize: size * 0.42,
                fontWeight: 600,
                letterSpacing: "0.02em",
                marginLeft: i === 0 ? 0 : -size * 0.32,
                border: "1px solid var(--color-bg)",
                boxShadow: "0 0 0 1px var(--color-rule)",
                position: "relative",
                zIndex: visible - i,
              }}
            >
              {initials}
            </span>
          );
        })}
      </span>
      {overflow > 0 && (
        <span
          className="mono ml-2 text-[0.625rem] uppercase tracking-[0.08em]"
          style={{ color: "var(--color-text-3)" }}
        >
          +{overflow}
        </span>
      )}
      <span
        className="mono ml-2 text-[0.625rem] uppercase tracking-[0.08em] inline-flex items-center gap-1.5"
        style={{ color: "var(--color-signal)" }}
      >
        <span
          aria-hidden
          className="inline-block rounded-full"
          style={{
            width: 5,
            height: 5,
            background: "var(--color-signal)",
            animation: "signal-pulse 1800ms var(--ease-out-quint) infinite",
          }}
        />
        watching
      </span>
    </span>
  );
}
