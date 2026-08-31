import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";

export interface CameraViewHandle {
  captureFrame: () => string | null;
}

interface CameraViewProps {
  onError: (message: string) => void;
  onStreamChange?: (active: boolean) => void;
}

/**
 * Wraps the browser's getUserMedia webcam API. Exposes a captureFrame()
 * method (via ref) that grabs the current video frame as a base64 JPEG
 * data-URI, ready to send to the backend for detection.
 */
const CameraView = forwardRef<CameraViewHandle, CameraViewProps>(({ onError, onStreamChange }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);

  useImperativeHandle(ref, () => ({
    captureFrame: () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !isActive) return null;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.92);
    },
  }));

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsActive(true);
      onStreamChange?.(true);
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Camera permission was denied. Please allow camera access and try again."
          : "Could not access the camera. Make sure it is connected and not in use by another app.";
      onError(message);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsActive(false);
    onStreamChange?.(false);
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div className="camera-view">
      <div className="camera-frame">
        {!isActive && <div className="camera-placeholder">Camera is off</div>}
        <video ref={videoRef} playsInline muted className={isActive ? "camera-video-active" : "camera-video-hidden"} />
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
      <div className="camera-controls">
        {!isActive ? (
          <button className="btn btn-primary" onClick={startCamera}>
            Start Camera
          </button>
        ) : (
          <button className="btn btn-danger" onClick={stopCamera}>
            Stop Camera
          </button>
        )}
      </div>
    </div>
  );
});

CameraView.displayName = "CameraView";
export default CameraView;
