"""
main.py
-------
FastAPI application exposing the circle-detection pipeline to the
React frontend.

Endpoints:
    GET  /api/health
    POST /api/detect          (JSON body: base64 image + optional settings)
    POST /api/detect/upload   (multipart/form-data image upload)
    POST /api/webcam/detect   (JSON body: base64 frame captured from webcam)
"""

import base64
import traceback
from typing import Optional

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from config import DEFAULT_CONFIG, MAX_UPLOAD_SIZE_MB, ALLOWED_CONTENT_TYPES, JPEG_QUALITY
from circle_detector import CircleDetector
from models import (
    DetectionSettings,
    DetectionResponse,
    DetectionImages,
    Detection,
    HealthResponse,
)

app = FastAPI(
    title="OpenCV Circle Detection API",
    description="Contour-based circle detection without Hough Circle Transform.",
    version="1.0.0",
)

# ----------------------------------------------------------------------
# CORS - allow the local Vite dev server (and any origin during dev) to
# call this API.
# ----------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------
def image_to_base64(image: np.ndarray, quality: int = JPEG_QUALITY) -> str:
    """
    Encodes an OpenCV (BGR or grayscale) image into a base64 data-URI
    string that can be dropped directly into an <img src="..."> tag.
    """
    if image is None:
        raise ValueError("Cannot encode an empty image")

    success, buffer = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not success:
        raise ValueError("Failed to encode image to JPEG")

    encoded = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/jpeg;base64,{encoded}"


def decode_base64_image(data: str) -> np.ndarray:
    """
    Decodes a base64 data-URI (or raw base64 string) into an OpenCV
    BGR numpy image. Raises ValueError on invalid input.
    """
    if not data:
        raise ValueError("Empty image data received")

    if "," in data:
        # Strip the "data:image/...;base64," prefix if present
        data = data.split(",", 1)[1]

    try:
        raw_bytes = base64.b64decode(data)
    except Exception as exc:
        raise ValueError("Invalid base64 image data") from exc

    np_arr = np.frombuffer(raw_bytes, dtype=np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Could not decode image data (unsupported or corrupt format)")

    return image


def decode_upload_bytes(raw_bytes: bytes) -> np.ndarray:
    """Decodes raw uploaded file bytes into an OpenCV BGR image."""
    if not raw_bytes:
        raise ValueError("Uploaded file is empty")

    np_arr = np.frombuffer(raw_bytes, dtype=np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Could not decode uploaded image (unsupported or corrupt format)")

    return image


def build_detection_response(image: np.ndarray, settings: Optional[DetectionSettings]) -> DetectionResponse:
    """
    Runs the full CircleDetector pipeline on the given image and packages
    the results into a DetectionResponse.
    """
    config = DEFAULT_CONFIG
    if settings is not None:
        config = settings.merge_into(DEFAULT_CONFIG)
    else:
        config = config.sanitized()

    detector = CircleDetector(config)
    result = detector.detect(image)

    detections = [
        Detection(
            id=idx,
            center_x=d.center_x,
            center_y=d.center_y,
            width=d.width,
            height=d.height,
            mean_radius=d.mean_radius,
            bad_points=d.bad_points,
        )
        for idx, d in enumerate(result["detections"], start=1)
    ]

    images = DetectionImages(
        original=image_to_base64(image),
        grayscale=image_to_base64(result["grayscale"]),
        median=image_to_base64(result["median"]),
        canny=image_to_base64(result["canny"]),
        output=image_to_base64(result["output"]),
    )

    height, width = image.shape[:2]

    return DetectionResponse(
        success=True,
        circle_count=len(detections),
        contours_found=result["contours_found"],
        processing_time_ms=result["processing_time_ms"],
        image_width=width,
        image_height=height,
        detections=detections,
        images=images,
        settings_used=config,
    )


# ----------------------------------------------------------------------
# Request models
# ----------------------------------------------------------------------
class DetectRequest(BaseModel):
    image: str  # base64 data-URI
    settings: Optional[DetectionSettings] = None


# ----------------------------------------------------------------------
# Routes
# ----------------------------------------------------------------------
@app.get("/api/health", response_model=HealthResponse)
def health_check():
    """Simple liveness/readiness probe used by the frontend to detect an offline backend."""
    return HealthResponse(
        status="ok",
        message="Circle Detection API is running",
        opencv_version=cv2.__version__,
    )


@app.post("/api/detect", response_model=DetectionResponse, responses={400: {"description": "Bad request"}})
def detect_circles(payload: DetectRequest):
    """
    Accepts a base64-encoded image (and optional settings overrides) as
    JSON, runs the detection pipeline, and returns full results
    including every intermediate processing stage as base64 images.
    """
    try:
        image = decode_base64_image(payload.image)
        return build_detection_response(image, payload.settings)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception:
        # Never leak stack traces to the client.
        raise HTTPException(status_code=500, detail="Internal error while processing the image")


@app.post("/api/detect/upload", response_model=DetectionResponse)
async def detect_circles_upload(
    file: UploadFile = File(...),
    canny_low: Optional[int] = Form(None),
    canny_high: Optional[int] = Form(None),
    median_kernel: Optional[int] = Form(None),
    min_contour_points: Optional[int] = Form(None),
    distance_threshold: Optional[float] = Form(None),
    max_bad_points: Optional[int] = Form(None),
):
    """
    Accepts a multipart/form-data image upload (from the drag-and-drop
    / file-picker UI) plus optional individual settings fields, runs
    detection, and returns full results.
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Allowed: JPG, JPEG, PNG, WEBP.",
        )

    raw_bytes = await file.read()

    if len(raw_bytes) > MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large. Max size is {MAX_UPLOAD_SIZE_MB}MB.")

    settings = DetectionSettings(
        canny_low=canny_low,
        canny_high=canny_high,
        median_kernel=median_kernel,
        min_contour_points=min_contour_points,
        distance_threshold=distance_threshold,
        max_bad_points=max_bad_points,
    )

    try:
        image = decode_upload_bytes(raw_bytes)
        return build_detection_response(image, settings)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception:
        raise HTTPException(status_code=500, detail="Internal error while processing the uploaded image")


@app.post("/api/webcam/detect", response_model=DetectionResponse)
def detect_circles_webcam(payload: DetectRequest):
    """
    Accepts a single base64-encoded frame captured from the browser's
    webcam feed and runs the same detection pipeline used for uploads.
    """
    try:
        image = decode_base64_image(payload.image)
        return build_detection_response(image, payload.settings)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception:
        raise HTTPException(status_code=500, detail="Internal error while processing the webcam frame")


@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    """
    Catch-all so that any unexpected error still returns a clean JSON
    error instead of leaking a Python traceback to the browser.
    """
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error", "detail": "An unexpected error occurred."},
    )
