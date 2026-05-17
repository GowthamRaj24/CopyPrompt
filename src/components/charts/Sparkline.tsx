import type { CSSProperties } from "react";

/**
 * Minimal SVG sparkline — no chart library, no bundle cost.
 *
 * Why roll our own
 * ────────────────
 * Every charting lib (Recharts, Chart.js, Tremor) ships ~100 KB minified.
 * For a single-line trend over <=90 points we only need:
 *   • normalize y into 0..1
 *   • plot a polyline
 *   • optional filled area for visual weight
 *
 * Total cost: ~80 lines of code, zero JS at runtime (SSR'd).
 * Pixel-perfect on Retina because SVG.
 */
interface SparklineProps {
  data: number[];
  /** SVG viewBox width (logical units, not pixels) */
  width?: number;
  height?: number;
  /** Stroke + fill color; defaults to currentColor so it inherits theme */
  color?: string;
  /** Show area under the line (default true) */
  fill?: boolean;
  /** Stroke width in viewBox units */
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}

export function Sparkline({
  data,
  width = 200,
  height = 48,
  color = "currentColor",
  fill = true,
  strokeWidth = 1.5,
  className,
  style,
  ariaLabel,
}: SparklineProps) {
  if (data.length < 2) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={className}
        style={style}
        aria-label={ariaLabel}
        role="img"
      >
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke={color}
          strokeOpacity={0.2}
          strokeDasharray="2 3"
          strokeWidth={1}
        />
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  // Add tiny epsilon to avoid divide-by-zero on flat series.
  const range = Math.max(max - min, 1);
  const stepX = width / (data.length - 1);

  // Reserve top/bottom padding so the highest peak doesn't kiss the edge.
  const padY = 3;
  const usableH = height - padY * 2;

  const points = data
    .map((v, i) => {
      const x = i * stepX;
      const y = padY + (1 - (v - min) / range) * usableH;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const areaPath = `M0,${height} L${points.replace(/ /g, " L")} L${width},${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={style}
      aria-label={ariaLabel}
      role="img"
      preserveAspectRatio="none"
    >
      {fill && (
        <path
          d={areaPath}
          fill={color}
          fillOpacity={0.08}
          stroke="none"
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
