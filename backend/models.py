"""
models.py
---------
Pydantic models describing the request/response shapes used by the
FastAPI backend. Keeping these separate from main.py keeps the API
layer thin and makes the schema easy to reuse/test.
"""

from typing import List, Optional
from pydantic import BaseModel, Field

from .config import DetectionConfig


class DetectionSettings(BaseModel):
    """Optional settings a client can send to override the default config."""
    canny_low: Optional[int] = None
    canny_high: Optional[int] = None
    median_kernel: Optional[int] = None
    min_contour_points: Optional[int] = None
    distance_threshold: Optional[float] = None
    max_bad_points: Optional[int] = None

    def merge_into(self, base: DetectionConfig) -> DetectionConfig:
        """Merge non-null fields on top of a base DetectionConfig."""
        data = base.dict()
        for key, value in self.dict().items():
            if value is not None:
                data[key] = value
        return DetectionConfig(**data).sanitized()


class Detection(BaseModel):
    """A single detected circle."""
    id: int
    center_x: int
    center_y: int
    width: int
    height: int
    mean_radius: float
    bad_points: int


class DetectionImages(BaseModel):
    """Base64 data-URI encoded images for every stage of the pipeline."""
    original: str
    grayscale: str
    median: str
    canny: str
    output: str


class DetectionResponse(BaseModel):
    """Full response returned by the /api/detect* endpoints."""
    success: bool
    circle_count: int
    contours_found: int
    processing_time_ms: float
    image_width: int
    image_height: int
    detections: List[Detection]
    images: DetectionImages
    settings_used: DetectionConfig


class ErrorResponse(BaseModel):
    """Generic error payload returned to the frontend. Never includes tracebacks."""
    success: bool = False
    error: str
    detail: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    message: str
    opencv_version: str
