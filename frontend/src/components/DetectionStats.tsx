import StatCard from "./StatCard";
import type { DetectionResponse } from "../types/detection";

interface DetectionStatsProps {
  result: DetectionResponse;
}

export default function DetectionStats({ result }: DetectionStatsProps) {
  return (
    <div className="stats-row">
      <StatCard label="Detected Circles" value={result.circle_count} icon="◎" accent="green" />
      <StatCard label="Processing Time" value={`${result.processing_time_ms} ms`} icon="⏱" accent="blue" />
      <StatCard label="Contours Found" value={result.contours_found} icon="✦" accent="amber" />
      <StatCard label="Algorithm" value="Contour Geometry" icon="Σ" accent="purple" />
    </div>
  );
}
