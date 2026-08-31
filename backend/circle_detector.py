"""
circle_detector.py
-------------------
Core computer-vision logic for detecting circular objects WITHOUT using
cv2.HoughCircles(). Instead this uses a contour + minAreaRect +
center-distance mathematical approach:

    1. Grayscale conversion
    2. Median blur (noise removal)
    3. Canny edge detection
    4. Find external contours
    5. Filter out tiny/noisy contours
    6. Fit a minAreaRect to each remaining contour
    7. Compute the rectangle's center
    8. For every point on the contour, compute its Euclidean distance
       to that center
    9. Compute the mean of all those distances (this approximates the
       "radius" of a circle)
    10. Any point whose distance deviates from the mean by more than
        DISTANCE_THRESHOLD is an "abnormal point"
    11. If the count of abnormal points is below MAX_BAD_POINTS, the
        contour is classified as a circle (a true circle has almost
        constant radius from its center, so very few abnormal points)

All algorithm parameters are read from a DetectionConfig instance —
nothing is hardcoded here.
"""

import time
import math
from dataclasses import dataclass
from typing import List, Tuple, Optional

import cv2
import numpy as np

from .config import DetectionConfig


@dataclass
class CircleCandidate:
    """Internal representation of a single accepted circle detection."""
    contour: np.ndarray
    center_x: int
    center_y: int
    width: int
    height: int
    mean_radius: float
    bad_points: int


class CircleDetector:
    """
    Encapsulates the full circle-detection pipeline.

    Usage:
        detector = CircleDetector(config)
        result = detector.detect(image_bgr)
    """

    def __init__(self, config: DetectionConfig):
        self.config = config

    # ------------------------------------------------------------------
    # Pipeline stage 1-3: preprocessing
    # ------------------------------------------------------------------
    def preprocess(self, image: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Converts the input BGR image into:
            grayscale -> median-blurred -> Canny edges

        Returns (grayscale, median_blurred, canny_edges) as separate
        single-channel images so each stage can be displayed to the user.
        """
        grayscale = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        kernel = self.config.median_kernel
        if kernel % 2 == 0:
            kernel += 1  # cv2.medianBlur requires an odd kernel size
        median = cv2.medianBlur(grayscale, kernel)

        edges = cv2.Canny(median, self.config.canny_low, self.config.canny_high)

        return grayscale, median, edges

    # ------------------------------------------------------------------
    # Pipeline stage 4-5: contour extraction + size filtering
    # ------------------------------------------------------------------
    def find_circle_candidates(self, canny: np.ndarray) -> List[np.ndarray]:
        """
        Finds external contours in the Canny edge image and filters out
        contours that are too small to realistically be a circle of
        interest (removes noise speckles).
        """
        contours, _ = cv2.findContours(canny, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)

        filtered = [c for c in contours if len(c) >= self.config.min_contour_points]
        return filtered

    # ------------------------------------------------------------------
    # Pipeline stage 6-10: the mathematical circle test
    # ------------------------------------------------------------------
    def analyze_contour(self, contour: np.ndarray) -> Optional[CircleCandidate]:
        """
        Applies the minAreaRect + center-distance test to a single contour.

        Returns a CircleCandidate if the contour is classified as a
        circle, otherwise None.
        """
        # Step 5: fit the minimum-area bounding rectangle
        rect = cv2.minAreaRect(contour)  # ((cx, cy), (w, h), angle)
        (center_x, center_y), (width, height), _angle = rect

        if width <= 0 or height <= 0:
            return None

        # Step 7: rectangle center is already given by minAreaRect
        points = contour.reshape(-1, 2).astype(np.float64)

        # Step 8: Euclidean distance from every contour point to the center
        dx = points[:, 0] - center_x
        dy = points[:, 1] - center_y
        distances = np.sqrt(dx * dx + dy * dy)

        # Step 9: mean distance approximates the circle's radius
        mean_distance = float(np.mean(distances))

        # Step 10: count how many points deviate from the mean by more
        # than the configured threshold
        deviations = np.abs(distances - mean_distance)
        bad_points = int(np.sum(deviations > self.config.distance_threshold))

        # Step 11 (classification): few abnormal points => circle
        if bad_points < self.config.max_bad_points:
            return CircleCandidate(
                contour=contour,
                center_x=int(round(center_x)),
                center_y=int(round(center_y)),
                width=int(round(width)),
                height=int(round(height)),
                mean_radius=round(mean_distance, 2),
                bad_points=bad_points,
            )

        return None

    # ------------------------------------------------------------------
    # Drawing the final annotated output image
    # ------------------------------------------------------------------
    def draw_results(self, image: np.ndarray, detections: List[CircleCandidate]) -> np.ndarray:
        """
        Draws a red rectangle, yellow index number, and a center marker
        for every detected circle onto a copy of the original image.
        """
        output = image.copy()

        for idx, det in enumerate(detections, start=1):
            top_left = (det.center_x - det.width // 2, det.center_y - det.height // 2)
            bottom_right = (det.center_x + det.width // 2, det.center_y + det.height // 2)

            # Red rectangle around the detected circle
            cv2.rectangle(output, top_left, bottom_right, (0, 0, 255), 2)

            # Center marker (small green dot + crosshair)
            cv2.circle(output, (det.center_x, det.center_y), 3, (0, 255, 0), -1)
            cv2.drawMarker(output, (det.center_x, det.center_y), (0, 255, 0),
                            markerType=cv2.MARKER_CROSS, markerSize=10, thickness=1)

            # Yellow circle number, positioned just above the rectangle
            label_pos = (top_left[0], max(top_left[1] - 8, 15))
            cv2.putText(output, str(idx), label_pos, cv2.FONT_HERSHEY_SIMPLEX,
                        0.7, (0, 255, 255), 2, cv2.LINE_AA)

        return output

    # ------------------------------------------------------------------
    # Full pipeline entry point
    # ------------------------------------------------------------------
    def detect(self, image: np.ndarray):
        """
        Runs the complete detection pipeline on a BGR image.

        Returns a dict with every intermediate image (as numpy arrays),
        the list of CircleCandidate detections, the number of raw
        contours found, and the processing time in milliseconds.
        """
        start = time.perf_counter()

        grayscale, median, canny = self.preprocess(image)
        candidates = self.find_circle_candidates(canny)

        detections: List[CircleCandidate] = []
        for contour in candidates:
            result = self.analyze_contour(contour)
            if result is not None:
                detections.append(result)

        output_image = self.draw_results(image, detections)

        elapsed_ms = (time.perf_counter() - start) * 1000.0

        return {
            "grayscale": grayscale,
            "median": median,
            "canny": canny,
            "output": output_image,
            "detections": detections,
            "contours_found": len(candidates),
            "processing_time_ms": round(elapsed_ms, 2),
        }
