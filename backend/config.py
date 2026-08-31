"""
config.py
---------
Central configuration for the Circle Detection backend.
All tunable constants live here so nothing is hardcoded elsewhere
in the codebase. These values can be overridden at runtime through
the /api/detect endpoint's optional "settings" payload.
"""

from pydantic import BaseModel, Field


class DetectionConfig(BaseModel):
    """Runtime-configurable parameters for the circle detection algorithm."""

    canny_low: int = Field(default=80, ge=0, le=500, description="Lower threshold for Canny edge detection")
    canny_high: int = Field(default=240, ge=0, le=500, description="Upper threshold for Canny edge detection")
    median_kernel: int = Field(default=5, ge=1, le=31, description="Kernel size for median blur (must be odd)")
    min_contour_points: int = Field(default=50, ge=3, le=1000, description="Minimum number of points a contour must have to be considered")
    distance_threshold: float = Field(default=3.0, ge=0.1, le=100.0, description="Max allowed deviation from mean radius before a point is 'abnormal'")
    max_bad_points: int = Field(default=5, ge=0, le=200, description="Maximum number of abnormal points allowed for a contour to still be classified as a circle")

    def sanitized(self) -> "DetectionConfig":
        """Return a copy with values corrected to be safe for OpenCV (e.g. odd kernel size)."""
        kernel = self.median_kernel
        if kernel % 2 == 0:
            kernel += 1
        low = min(self.canny_low, self.canny_high)
        high = max(self.canny_low, self.canny_high)
        return DetectionConfig(
            canny_low=low,
            canny_high=high,
            median_kernel=kernel,
            min_contour_points=self.min_contour_points,
            distance_threshold=self.distance_threshold,
            max_bad_points=self.max_bad_points,
        )


# Default configuration instance, used when no custom settings are supplied.
DEFAULT_CONFIG = DetectionConfig()

# Server-level constants
MAX_UPLOAD_SIZE_MB = 15
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
JPEG_QUALITY = 90
