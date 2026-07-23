// Dependency-free inline SVG charts. Recharts 3 calls eval()/new Function at
// render time, which the app's strict CSP (no 'unsafe-eval', SPEC §8)
// blocks — the charts rendered blank in production. These hand-rolled SVGs
// are CSP-clean, theme-token-styled, and need no client JS.

const INK = "#f8e7c9";
const INK_SOFT = "#c3d6cd";
const AMBER = "#f8e7c9";
const LINE = "#1c6b55";
const RED = "#fca5a5";

/** Daily alert counts over the last 30 days (vertical bars). */
export function AlertsChart({
  data,
}: {
  data: Array<{ day: string; alerts: number }>;
}) {
  const W = 720;
  const H = 240;
  const padL = 28;
  const padR = 8;
  const padT = 12;
  const padB = 26;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const max = Math.max(1, ...data.map((d) => d.alerts));
  const n = data.length || 1;
  const slot = chartW / n;
  const barW = Math.max(2, slot * 0.6);
  const yFor = (v: number) => padT + chartH - (v / max) * chartH;

  // Y gridlines/ticks at 0, mid, max (integer, de-duplicated).
  const ticks = Array.from(new Set([0, Math.ceil(max / 2), max]));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-64 w-full"
      role="img"
      aria-label="Alerts per day, last 30 days"
      preserveAspectRatio="none"
    >
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={padL}
            x2={W - padR}
            y1={yFor(t)}
            y2={yFor(t)}
            stroke={LINE}
            strokeDasharray="3 3"
          />
          <text
            x={padL - 6}
            y={yFor(t) + 3}
            fontSize="10"
            fill={INK_SOFT}
            textAnchor="end"
          >
            {t}
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = padL + i * slot + (slot - barW) / 2;
        const h = (d.alerts / max) * chartH;
        return (
          <g key={d.day}>
            {d.alerts > 0 && (
              <rect
                x={x}
                y={padT + chartH - h}
                width={barW}
                height={h}
                rx="2"
                fill={AMBER}
              >
                <title>{`${d.day}: ${d.alerts} alert${d.alerts === 1 ? "" : "s"}`}</title>
              </rect>
            )}
            {i % 5 === 0 && (
              <text
                x={padL + i * slot + slot / 2}
                y={H - 8}
                fontSize="10"
                fill={INK_SOFT}
                textAnchor="middle"
              >
                {d.day}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Lowest-stock tracked products (horizontal bars with a threshold marker). */
export function StockChart({
  data,
}: {
  data: Array<{ name: string; qty: number; threshold: number }>;
}) {
  const rowH = 30;
  const labelW = 150;
  const valueW = 40;
  const W = 720;
  const H = Math.max(rowH, data.length * rowH) + 8;
  const barMaxX = W - labelW - valueW;
  const max = Math.max(1, ...data.map((d) => Math.max(d.qty, d.threshold)));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: H }}
      role="img"
      aria-label="Lowest stock tracked products"
    >
      {data.map((d, i) => {
        const y = i * rowH + 4;
        const cy = y + rowH / 2;
        const barW = (d.qty / max) * barMaxX;
        const threshX = labelW + (d.threshold / max) * barMaxX;
        const oos = d.qty <= 0;
        return (
          <g key={`${d.name}-${i}`}>
            <text x={0} y={cy + 3} fontSize="12" fill={INK}>
              {d.name}
            </text>
            {/* track */}
            <rect
              x={labelW}
              y={cy - 7}
              width={barMaxX}
              height={14}
              rx="3"
              fill="#053f30"
            />
            {/* value bar */}
            {!oos && (
              <rect
                x={labelW}
                y={cy - 7}
                width={Math.max(2, barW)}
                height={14}
                rx="3"
                fill={AMBER}
              />
            )}
            {/* threshold marker */}
            <line
              x1={threshX}
              x2={threshX}
              y1={cy - 10}
              y2={cy + 10}
              stroke={INK_SOFT}
              strokeDasharray="2 2"
            >
              <title>{`Threshold ${d.threshold}`}</title>
            </line>
            {/* value label */}
            <text
              x={W - valueW + 6}
              y={cy + 3}
              fontSize="12"
              fontWeight={oos ? 600 : 400}
              fill={oos ? RED : INK_SOFT}
            >
              {oos ? "out" : d.qty}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
