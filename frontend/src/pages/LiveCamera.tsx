import { useRef, useState } from "react";
import CameraView, { type CameraViewHandle } from "../components/CameraView";
import ErrorMessage from "../components/ErrorMessage";
import { detectFromWebcam, ApiRequestError } from "../api/detectionApi";
import type { DetectionResponse } from "../types/detection";

interface LiveCameraProps {
  onResult: (result: DetectionResponse) => void;
}

const REQUIREMENTS = [
  "Camera is parallel to the target surface.",
  "Shadows are minimized.",
  "Lighting is uniform.",
  "Circles are clearly visible.",
  "Objects are not heavily occluded.",
];

export default function LiveCamera({ onResult }: LiveCameraProps) {
  const cameraRef = useRef<CameraViewHandle>(null);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const handleCapture = () => {
    const frame = cameraRef.current?.captureFrame();
    if (!frame) {
      setError("Could not capture a frame. Make sure the camera is started.");
      return;
    }
    setCapturedFrame(frame);
    setResult(null);
  };

  const handleDetect = async () => {
    if (!capturedFrame) return;
    setLoading(true);
    setError(null);
    try {
      const response = await detectFromWebcam(capturedFrame);
      setResult(response);
      onResult(response);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Detection failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!result) return;
    const link = document.createElement("a");
    link.href = result.images.output;
    link.download = "circle-detection-result.jpg";
    link.click();
  };

  return (
    <div className="page">
      <h1 className="page-title">Live Camera</h1>
      <p className="page-subtitle">Capture a frame from your webcam and detect circles in it.</p>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      <div className="camera-layout">
        <div className="camera-left">
          <CameraView ref={cameraRef} onError={setError} onStreamChange={setCameraActive} />
          <div className="camera-controls">
            <button className="btn btn-secondary" onClick={handleCapture} disabled={!cameraActive}>
              Capture Frame
            </button>
            <button className="btn btn-primary" onClick={handleDetect} disabled={!capturedFrame || loading}>
              {loading ? "Detecting..." : "Detect Circles"}
            </button>
            <button className="btn btn-outline" onClick={handleSave} disabled={!result}>
              Save Result
            </button>
          </div>

          {capturedFrame && !result && (
            <div className="preview-block">
              <div className="image-result-label">Captured Frame</div>
              <div className="image-result-frame">
                <img src={capturedFrame} alt="Captured frame" />
              </div>
            </div>
          )}

          <div className="requirements-panel">
            <h3>Best results when:</h3>
            <ol>
              {REQUIREMENTS.map((req, idx) => (
                <li key={idx}>{req}</li>
              ))}
            </ol>
          </div>
        </div>

        <div className="camera-right">
          <h3>Detection Information</h3>
          {result ? (
            <>
              <div className="info-grid">
                <div className="info-grid-item">
                  <span className="info-grid-label">Circle Count</span>
                  <span className="info-grid-value">{result.circle_count}</span>
                </div>
                <div className="info-grid-item">
                  <span className="info-grid-label">Processing Time</span>
                  <span className="info-grid-value">{result.processing_time_ms} ms</span>
                </div>
                <div className="info-grid-item">
                  <span className="info-grid-label">Contours Found</span>
                  <span className="info-grid-value">{result.contours_found}</span>
                </div>
              </div>

              <div className="image-result-frame">
                <img src={result.images.output} alt="Detected circles" />
              </div>

              <h4>Detection Coordinates</h4>
              <table className="coord-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Center X</th>
                    <th>Center Y</th>
                    <th>Radius</th>
                  </tr>
                </thead>
                <tbody>
                  {result.detections.map((d) => (
                    <tr key={d.id}>
                      <td>{d.id}</td>
                      <td>{d.center_x}</td>
                      <td>{d.center_y}</td>
                      <td>{d.mean_radius}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p className="muted-text">Capture a frame and press "Detect Circles" to see results here.</p>
          )}
        </div>
      </div>
    </div>
  );
}
