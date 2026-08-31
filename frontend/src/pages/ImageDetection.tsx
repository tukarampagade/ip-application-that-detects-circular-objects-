import { useState } from "react";
import ImageUploader from "../components/ImageUploader";
import ProcessingPipeline from "../components/ProcessingPipeline";
import DetectionStats from "../components/DetectionStats";
import ErrorMessage from "../components/ErrorMessage";
import { detectFromUpload } from "../api/detectionApi";
import { ApiRequestError } from "../api/detectionApi";
import type { DetectionResponse, DetectionSettings } from "../types/detection";
import { DEFAULT_SETTINGS } from "../types/detection";

interface ImageDetectionProps {
  onResult: (result: DetectionResponse) => void;
}

export default function ImageDetection({ onResult }: ImageDetectionProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<DetectionSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);

  const handleFileSelected = (selected: File) => {
    setFile(selected);
    setResult(null);
    setError(null);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const runDetection = async (fileToUse: File, settingsToUse: DetectionSettings) => {
    setLoading(true);
    setError(null);
    try {
      const response = await detectFromUpload(fileToUse, settingsToUse);
      setResult(response);
      onResult(response);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Detection failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDetectClick = () => {
    if (!file) return;
    runDetection(file, settings);
  };

  const updateSetting = (key: keyof DetectionSettings, value: number) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    if (file && result) {
      runDetection(file, updated);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Image Detection</h1>
      <p className="page-subtitle">Upload an image to run the contour-based circle detection pipeline.</p>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      <div className="detection-layout">
        <div className="detection-left">
          <ImageUploader onFileSelected={handleFileSelected} disabled={loading} />

          {previewUrl && (
            <div className="preview-block">
              <div className="image-result-label">Selected Image Preview</div>
              <div className="image-result-frame">
                <img src={previewUrl} alt="Selected preview" />
              </div>
              <button className="btn btn-primary" onClick={handleDetectClick} disabled={loading}>
                {loading ? "Detecting..." : "Detect Circles"}
              </button>
            </div>
          )}
        </div>

        <div className="detection-right">
          <button className="btn btn-outline settings-toggle" onClick={() => setShowSettings((s) => !s)}>
            {showSettings ? "Hide Settings" : "Show Settings"}
          </button>

          {showSettings && (
            <div className="settings-panel">
              <h3>Detection Settings</h3>
              <SettingSlider
                label="Canny Low"
                value={settings.canny_low}
                min={0}
                max={255}
                onChange={(v) => updateSetting("canny_low", v)}
              />
              <SettingSlider
                label="Canny High"
                value={settings.canny_high}
                min={0}
                max={500}
                onChange={(v) => updateSetting("canny_high", v)}
              />
              <SettingSlider
                label="Median Kernel"
                value={settings.median_kernel}
                min={1}
                max={15}
                step={2}
                onChange={(v) => updateSetting("median_kernel", v)}
              />
              <SettingSlider
                label="Minimum Contour Points"
                value={settings.min_contour_points}
                min={3}
                max={300}
                onChange={(v) => updateSetting("min_contour_points", v)}
              />
              <SettingSlider
                label="Distance Threshold"
                value={settings.distance_threshold}
                min={0.5}
                max={20}
                step={0.5}
                onChange={(v) => updateSetting("distance_threshold", v)}
              />
              <SettingSlider
                label="Maximum Bad Points"
                value={settings.max_bad_points}
                min={0}
                max={50}
                onChange={(v) => updateSetting("max_bad_points", v)}
              />
            </div>
          )}
        </div>
      </div>

      {result && (
        <>
          <div className="result-banner">
            {result.circle_count} Circle{result.circle_count === 1 ? "" : "s"} Detected —{" "}
            {result.processing_time_ms} ms
          </div>
          <DetectionStats result={result} />
          <h2 className="section-title">Processing Stages</h2>
          <ProcessingPipeline images={result.images} />
        </>
      )}
    </div>
  );
}

interface SettingSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

function SettingSlider({ label, value, min, max, step = 1, onChange }: SettingSliderProps) {
  return (
    <div className="setting-row">
      <div className="setting-row-header">
        <span>{label}</span>
        <span className="setting-value">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
