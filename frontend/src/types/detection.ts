// Type definitions shared across the frontend for the circle-detection domain.

export interface DetectionSettings {
  canny_low: number;
  canny_high: number;
  median_kernel: number;
  min_contour_points: number;
  distance_threshold: number;
  max_bad_points: number;
}

export const DEFAULT_SETTINGS: DetectionSettings = {
  canny_low: 80,
  canny_high: 240,
  median_kernel: 5,
  min_contour_points: 50,
  distance_threshold: 3,
  max_bad_points: 5,
};

export interface Detection {
  id: number;
  center_x: number;
  center_y: number;
  width: number;
  height: number;
  mean_radius: number;
  bad_points: number;
}

export interface DetectionImages {
  original: string;
  grayscale: string;
  median: string;
  canny: string;
  output: string;
}

export interface DetectionResponse {
  success: boolean;
  circle_count: number;
  contours_found: number;
  processing_time_ms: number;
  image_width: number;
  image_height: number;
  detections: Detection[];
  images: DetectionImages;
  settings_used: DetectionSettings;
}

export interface HealthResponse {
  status: string;
  message: string;
  opencv_version: string;
}

export interface ApiError {
  message: string;
}
