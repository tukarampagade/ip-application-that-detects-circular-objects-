import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "../components/StatCard";
import { checkHealth } from "../api/detectionApi";
import type { DetectionResponse } from "../types/detection";

interface DashboardProps {
  lastResult: DetectionResponse | null;
}

export default function Dashboard({ lastResult }: DashboardProps) {
  const navigate = useNavigate();
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    checkHealth()
      .then(() => setBackendStatus("online"))
      .catch(() => setBackendStatus("offline"));
  }, []);

  return (
    <div className="page">
      <section className="hero">
        <h1 className="hero-title">Detect Circles Without HoughCircles</h1>
        <p className="hero-description">
          An OpenCV computer vision system using contour geometry, minAreaRect, and center-distance
          analysis.
        </p>
        <button className="btn btn-primary btn-large" onClick={() => navigate("/detect")}>
          Start Detection
        </button>
        <div className={`backend-status backend-status-${backendStatus}`}>
          <span className="status-dot" />
          {backendStatus === "checking" && "Checking backend connection..."}
          {backendStatus === "online" && "Backend connected"}
          {backendStatus === "offline" && "Backend offline — start the FastAPI server"}
        </div>
      </section>

      <section className="stats-row">
        <StatCard
          label="Detected Circles"
          value={lastResult ? lastResult.circle_count : "—"}
          icon="◎"
          accent="green"
        />
        <StatCard
          label="Processing Time"
          value={lastResult ? `${lastResult.processing_time_ms} ms` : "—"}
          icon="⏱"
          accent="blue"
        />
        <StatCard
          label="Contours Found"
          value={lastResult ? lastResult.contours_found : "—"}
          icon="✦"
          accent="amber"
        />
        <StatCard label="Algorithm" value="Contour Geometry" icon="Σ" accent="purple" />
      </section>

      <section className="info-cards">
        <div className="info-card">
          <h3>Image Detection</h3>
          <p>Upload a JPG, PNG, or WEBP image and see every stage of the detection pipeline.</p>
          <button className="btn btn-outline" onClick={() => navigate("/detect")}>
            Go to Image Detection
          </button>
        </div>
        <div className="info-card">
          <h3>Live Camera</h3>
          <p>Use your webcam to capture a frame and detect circles in real time.</p>
          <button className="btn btn-outline" onClick={() => navigate("/camera")}>
            Go to Live Camera
          </button>
        </div>
        <div className="info-card">
          <h3>Algorithm</h3>
          <p>Understand exactly how contour geometry replaces the Hough Circle Transform.</p>
          <button className="btn btn-outline" onClick={() => navigate("/algorithm")}>
            View Algorithm
          </button>
        </div>
      </section>
    </div>
  );
}
