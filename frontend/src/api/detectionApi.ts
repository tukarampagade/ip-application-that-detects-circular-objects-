// Thin API client wrapping fetch() calls to the FastAPI backend.
// The base URL is read from VITE_API_URL so nothing is hardcoded.

import type { DetectionResponse, DetectionSettings, HealthResponse, ApiError } from "../types/detection";

const API_URL: string = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

class ApiRequestError extends Error implements ApiError {
  constructor(message: string) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (data?.detail) return String(data.detail);
    if (data?.error) return String(data.error);
  } catch {
    // response body wasn't JSON — fall through to generic message
  }
  return `Request failed with status ${response.status}`;
}

/** Checks whether the backend is reachable. */
export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_URL}/api/health`);
  if (!response.ok) {
    throw new ApiRequestError(await parseErrorResponse(response));
  }
  return response.json();
}

/** Sends a base64 data-URI image (e.g. from a webcam capture) for detection. */
export async function detectFromBase64(
  imageDataUrl: string,
  settings?: DetectionSettings,
  endpoint: "/api/detect" | "/api/webcam/detect" = "/api/detect"
): Promise<DetectionResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageDataUrl, settings: settings ?? null }),
    });
  } catch {
    throw new ApiRequestError("Could not reach the backend. Is the server running?");
  }

  if (!response.ok) {
    throw new ApiRequestError(await parseErrorResponse(response));
  }
  return response.json();
}

/** Uploads an image file (drag-and-drop or file picker) for detection. */
export async function detectFromUpload(
  file: File,
  settings?: DetectionSettings
): Promise<DetectionResponse> {
  const formData = new FormData();
  formData.append("file", file);

  if (settings) {
    formData.append("canny_low", String(settings.canny_low));
    formData.append("canny_high", String(settings.canny_high));
    formData.append("median_kernel", String(settings.median_kernel));
    formData.append("min_contour_points", String(settings.min_contour_points));
    formData.append("distance_threshold", String(settings.distance_threshold));
    formData.append("max_bad_points", String(settings.max_bad_points));
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/detect/upload`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new ApiRequestError("Could not reach the backend. Is the server running?");
  }

  if (!response.ok) {
    throw new ApiRequestError(await parseErrorResponse(response));
  }
  return response.json();
}

/** Sends a webcam-captured frame (base64) for detection. */
export async function detectFromWebcam(
  imageDataUrl: string,
  settings?: DetectionSettings
): Promise<DetectionResponse> {
  return detectFromBase64(imageDataUrl, settings, "/api/webcam/detect");
}

export { ApiRequestError };
