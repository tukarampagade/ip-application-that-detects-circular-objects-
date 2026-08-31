"""
main.py
-------
FastAPI application exposing the circle-detection pipeline to the
React frontend.

Endpoints:
    GET  /api/health
    POST /api/detect
    POST /api/detect/upload
    POST /api/webcam/detect
"""

import base64
from typing import Optional

import cv2
import numpy as np

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from .config import (
    DEFAULT_CONFIG,
    MAX_UPLOAD_SIZE_MB,
    ALLOWED_CONTENT_TYPES,
    JPEG_QUALITY,
)

from .circle_detector import CircleDetector

from .models import (
    DetectionSettings,
    DetectionResponse,
    DetectionImages,
    Detection,
    HealthResponse,
)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="OpenCV Circle Detection API",
    description=(
        "Contour-based circle detection application "
        "without using Hough Circle Transform."
    ),
    version="1.0.0",
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# IMAGE HELPERS
# ============================================================

def image_to_base64(
    image: np.ndarray,
    quality: int = JPEG_QUALITY,
) -> str:
    """
    Convert an OpenCV image to a base64 JPEG data URI.

    The returned string can directly be used as:
        <img src="..." />
    """

    if image is None:
        raise ValueError("Cannot encode an empty image.")

    if not isinstance(image, np.ndarray):
        raise ValueError("Invalid image format.")

    success, buffer = cv2.imencode(
        ".jpg",
        image,
        [cv2.IMWRITE_JPEG_QUALITY, quality],
    )

    if not success:
        raise ValueError("Failed to encode image to JPEG.")

    encoded = base64.b64encode(buffer).decode("utf-8")

    return f"data:image/jpeg;base64,{encoded}"


def decode_base64_image(data: str) -> np.ndarray:
    """
    Decode a base64 image or base64 data URI into
    an OpenCV BGR image.
    """

    if not data:
        raise ValueError("Empty image data received.")

    # Remove data URI prefix if present.
    if "," in data:
        data = data.split(",", 1)[1]

    try:
        raw_bytes = base64.b64decode(
            data,
            validate=True,
        )
    except Exception as exc:
        raise ValueError(
            "Invalid base64 image data."
        ) from exc

    if not raw_bytes:
        raise ValueError("Decoded image data is empty.")

    np_arr = np.frombuffer(
        raw_bytes,
        dtype=np.uint8,
    )

    image = cv2.imdecode(
        np_arr,
        cv2.IMREAD_COLOR,
    )

    if image is None:
        raise ValueError(
            "Could not decode image data. "
            "The image may be unsupported or corrupted."
        )

    return image


def decode_upload_bytes(raw_bytes: bytes) -> np.ndarray:
    """
    Decode uploaded image bytes into an OpenCV BGR image.
    """

    if not raw_bytes:
        raise ValueError("Uploaded file is empty.")

    np_arr = np.frombuffer(
        raw_bytes,
        dtype=np.uint8,
    )

    image = cv2.imdecode(
        np_arr,
        cv2.IMREAD_COLOR,
    )

    if image is None:
        raise ValueError(
            "Could not decode uploaded image. "
            "The image may be unsupported or corrupted."
        )

    return image


# ============================================================
# DETECTION PROCESSING
# ============================================================

def build_detection_response(
    image: np.ndarray,
    settings: Optional[DetectionSettings],
) -> DetectionResponse:
    """
    Run the complete circle-detection pipeline and
    construct the API response.
    """

    if image is None:
        raise ValueError("Input image is empty.")

    # --------------------------------------------------------
    # Configuration
    # --------------------------------------------------------

    if settings is not None:
        config = settings.merge_into(DEFAULT_CONFIG)
    else:
        # IMPORTANT:
        # Sanitize DEFAULT_CONFIG directly.
        config = DEFAULT_CONFIG.sanitized()

    # --------------------------------------------------------
    # Circle detector
    # --------------------------------------------------------

    detector = CircleDetector(config)

    result = detector.detect(image)

    if result is None:
        raise ValueError(
            "Circle detection returned no result."
        )

    # --------------------------------------------------------
    # Convert detections to API models
    # --------------------------------------------------------

    detections = []

    for idx, detection in enumerate(
        result.get("detections", []),
        start=1,
    ):
        detections.append(
            Detection(
                id=idx,
                center_x=detection.center_x,
                center_y=detection.center_y,
                width=detection.width,
                height=detection.height,
                mean_radius=detection.mean_radius,
                bad_points=detection.bad_points,
            )
        )

    # --------------------------------------------------------
    # Intermediate images
    # --------------------------------------------------------

    images = DetectionImages(
        original=image_to_base64(image),

        grayscale=image_to_base64(
            result["grayscale"]
        ),

        median=image_to_base64(
            result["median"]
        ),

        canny=image_to_base64(
            result["canny"]
        ),

        output=image_to_base64(
            result["output"]
        ),
    )

    # --------------------------------------------------------
    # Image dimensions
    # --------------------------------------------------------

    height, width = image.shape[:2]

    # --------------------------------------------------------
    # Final response
    # --------------------------------------------------------

    return DetectionResponse(
        success=True,

        circle_count=len(detections),

        contours_found=result.get(
            "contours_found",
            0,
        ),

        processing_time_ms=result.get(
            "processing_time_ms",
            0,
        ),

        image_width=width,
        image_height=height,

        detections=detections,

        images=images,

        settings_used=config,
    )


# ============================================================
# REQUEST MODELS
# ============================================================

class DetectRequest(BaseModel):
    """
    JSON request used by:
        POST /api/detect
        POST /api/webcam/detect
    """

    image: str
    settings: Optional[DetectionSettings] = None


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get(
    "/api/health",
    response_model=HealthResponse,
)
def health_check():
    """
    Check whether the Circle Detection API is running.
    """

    return HealthResponse(
        status="ok",
        message="Circle Detection API is running",
        opencv_version=cv2.__version__,
    )


# ============================================================
# BASE64 IMAGE DETECTION
# ============================================================

@app.post(
    "/api/detect",
    response_model=DetectionResponse,
    responses={
        400: {
            "description": "Bad request"
        }
    },
)
def detect_circles(
    payload: DetectRequest,
):
    """
    Detect circles from a base64-encoded image.
    """

    try:
        image = decode_base64_image(
            payload.image
        )

        return build_detection_response(
            image,
            payload.settings,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:
        print(
            f"Detection error: {type(exc).__name__}: {exc}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Internal error while "
                "processing the image."
            ),
        )


# ============================================================
# IMAGE UPLOAD DETECTION
# ============================================================

@app.post(
    "/api/detect/upload",
    response_model=DetectionResponse,
)
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
    Detect circles from an uploaded image.

    Supports:
        JPG
        JPEG
        PNG
        WEBP
    """

    # --------------------------------------------------------
    # Validate file type
    # --------------------------------------------------------

    if file.content_type not in ALLOWED_CONTENT_TYPES:

        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file type "
                f"'{file.content_type}'. "
                "Allowed: JPG, JPEG, PNG, WEBP."
            ),
        )

    # --------------------------------------------------------
    # Read uploaded file
    # --------------------------------------------------------

    raw_bytes = await file.read()

    # --------------------------------------------------------
    # Validate file size
    # --------------------------------------------------------

    max_size_bytes = (
        MAX_UPLOAD_SIZE_MB * 1024 * 1024
    )

    if len(raw_bytes) > max_size_bytes:

        raise HTTPException(
            status_code=400,
            detail=(
                f"File too large. "
                f"Maximum size is "
                f"{MAX_UPLOAD_SIZE_MB}MB."
            ),
        )

    # --------------------------------------------------------
    # Build settings
    # --------------------------------------------------------

    settings = DetectionSettings(
        canny_low=canny_low,
        canny_high=canny_high,
        median_kernel=median_kernel,
        min_contour_points=min_contour_points,
        distance_threshold=distance_threshold,
        max_bad_points=max_bad_points,
    )

    # --------------------------------------------------------
    # Decode and detect
    # --------------------------------------------------------

    try:

        image = decode_upload_bytes(
            raw_bytes
        )

        return build_detection_response(
            image,
            settings,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:

        print(
            f"Upload detection error: "
            f"{type(exc).__name__}: {exc}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Internal error while "
                "processing the uploaded image."
            ),
        )


# ============================================================
# WEBCAM DETECTION
# ============================================================

@app.post(
    "/api/webcam/detect",
    response_model=DetectionResponse,
)
def detect_circles_webcam(
    payload: DetectRequest,
):
    """
    Detect circles from a single webcam frame
    encoded as base64.
    """

    try:

        image = decode_base64_image(
            payload.image
        )

        return build_detection_response(
            image,
            payload.settings,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:

        print(
            f"Webcam detection error: "
            f"{type(exc).__name__}: {exc}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Internal error while "
                "processing the webcam frame."
            ),
        )


# ============================================================
# GLOBAL EXCEPTION HANDLER
# ============================================================

@app.exception_handler(Exception)
async def generic_exception_handler(
    request,
    exc,
):
    """
    Catch unexpected exceptions and return
    a clean JSON response.
    """

    print(
        f"Unhandled error: "
        f"{type(exc).__name__}: {exc}"
    )

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": "An unexpected error occurred.",
        },
    )


# ============================================================
# APPLICATION ENTRY POINT
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )