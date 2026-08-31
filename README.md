# 🔵 CircleVision — OpenCV Circle Detection

**A Full-Stack Computer Vision Framework for Geometric Circle Detection**

CircleVision is a real-time image-processing application that detects circular objects using OpenCV contour analysis and geometric distance validation, **without using `cv2.HoughCircles()`**.

The system accepts an uploaded image or webcam frame, processes it through grayscale conversion, median filtering, Canny edge detection, contour extraction, center estimation, and center-to-boundary distance analysis. The result is displayed through a modern web interface.

---

## 👥 Team Members

| Name | Role |
|---|---|
| **Tukaram Pagade** | Project Lead / Computer Vision & Integration |
| **Aditi Patil** | Frontend & UI Development |
| **Samarth Sunthakar** | Backend & API Development |
| **Prajwal Gadivaddar** | Testing, Documentation & Optimization |

---

## 📌 Overview

CircleVision is designed as an educational and practical computer-vision project. Instead of relying on a ready-made Hough Circle detector, it demonstrates the geometry behind circle detection.

The central idea is simple:

> For a true circle, contour points are approximately the same distance from the circle's center.

The application therefore follows this pipeline:

```text
Input Image / Camera
        ↓
Grayscale Conversion
        ↓
Median Blur
        ↓
Canny Edge Detection
        ↓
Contour Extraction
        ↓
Small Contour Filtering
        ↓
Center Estimation
        ↓
Euclidean Distance Calculation
        ↓
Mean Distance
        ↓
Abnormal / Bad Point Analysis
        ↓
Circle Classification
        ↓
Visual Result
```

---

## ✨ Features

- 📷 Upload JPG, PNG, WEBP and other browser-supported images
- 🎥 Webcam-ready architecture
- ⚙️ Adjustable Canny thresholds
- 🧹 Median filtering for noise reduction
- 🔎 External contour detection
- 📐 Geometry-based circle validation
- 🎯 Automatic center estimation
- 📏 Euclidean center-to-boundary distance analysis
- 📊 Circle count, contour count and processing time
- 🟢 Center visualization
- 🔴 Bounding-box visualization
- 🟡 Circle labels
- 🧪 Configurable detection thresholds
- 🖥️ Modern responsive frontend
- 🔌 FastAPI backend
- 🧩 Clean separation between UI, API and computer-vision logic
- 🚫 No `cv2.HoughCircles()` dependency

---

## 🧰 Technology Stack

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React + TypeScript | User interface and interaction |
| Build tool | Vite | Development and production build |
| UI icons | Lucide React | Interface icons |
| Backend | Python + FastAPI | REST API |
| Computer Vision | OpenCV | Image processing and contours |
| Numerical processing | NumPy | Array and distance calculations |
| Server | Uvicorn | FastAPI development server |
| API validation | Pydantic | Request/response models |

---

## 🏗️ Architecture

```text
┌──────────────────────────────────────────────┐
│                USER INTERFACE                 │
│             React + TypeScript                │
│                                                │
│  Upload Image ─┐                              │
│  Camera Frame ─┼──→ Detection Request         │
│  Settings ─────┘                              │
└──────────────────────┬───────────────────────┘
                        │ HTTP / JSON
                        ▼
┌──────────────────────────────────────────────┐
│                  FASTAPI                      │
│                                                │
│  /api/health                                  │
│  /api/detect                                  │
│  /api/detect/upload                           │
│  /api/webcam/detect                           │
└──────────────────────┬───────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────┐
│              OPENCV PIPELINE                  │
│                                                │
│ BGR → Gray → Median → Canny → Contours        │
│                         ↓                     │
│                 Center Estimation             │
│                         ↓                     │
│                Distance Analysis              │
│                         ↓                     │
│                 Circle Decision               │
└──────────────────────┬───────────────────────┘
                        │
                        ▼
                  Processed Result
```

---

## 🔬 Image Processing Pipeline

### 1. Grayscale Conversion

The input image is converted from BGR to grayscale:

```python
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
```

This reduces a three-channel color image to a single intensity channel.

### 2. Median Filtering

Noise is reduced using:

```python
median = cv2.medianBlur(gray, 5)
```

Median filtering is useful for reducing isolated noise while preserving object boundaries.

### 3. Canny Edge Detection

Edges are extracted using:

```python
edges = cv2.Canny(median, 80, 240)
```

The two values are the lower and upper edge thresholds.

### 4. Contour Extraction

The application finds external contours:

```python
contours, _ = cv2.findContours(
    edges,
    cv2.RETR_EXTERNAL,
    cv2.CHAIN_APPROX_SIMPLE
)
```

A contour represents a boundary formed by connected edge pixels.

### 5. Small Contour Filtering

Very small contours are usually noise or irrelevant details. The project therefore ignores contours below the configured point count:

```text
Minimum contour points = 50
```

### 6. Center Estimation

For each useful contour, a minimum-area rectangle is calculated:

```python
rect = cv2.minAreaRect(contour)
box = cv2.boxPoints(rect)
```

The center is estimated from the rectangle geometry.

### 7. Euclidean Distance

For every contour point `(x, y)`, the distance from the estimated center `(cx, cy)` is calculated:

```text
d = √((x - cx)² + (y - cy)²)
```

**Example:**

```text
Center = (10, 10)
Point  = (13, 14)

d = √((13-10)² + (14-10)²)
  = √25
  = 5 pixels
```

### 8. Mean Distance

The average radius-like distance is calculated:

```text
mean = sum(distances) / number_of_distances
```

For a circular object, most distances should be close to this mean.

### 9. Bad Point Detection

A contour point is considered abnormal when:

```text
|distance - mean_distance| > distance_threshold
```

Default:

```text
distance_threshold = 3 pixels
```

### 10. Circle Decision

The number of abnormal points is counted. Default rule:

```text
bad_points < 5  → Circle
bad_points ≥ 5  → Reject
```

This gives the application a simple geometric circle-validation mechanism.

---

## 📊 Detection Output

For every accepted circle, the backend returns:

```json
{
  "id": 1,
  "center_x": 250,
  "center_y": 180,
  "radius": 75.4,
  "contour_points": 218,
  "bad_points": 2,
  "confidence": 99.1
}
```

The response also includes:

- Number of detected circles
- Total contours
- Processing time
- Intermediate processing stages
- Final annotated image

---

## ⚙️ Configuration

The default settings are:

| Parameter | Default | Purpose |
|---|---|---|
| Canny Low | 80 | Lower edge threshold |
| Canny High | 240 | Upper edge threshold |
| Median Kernel | 5 | Noise reduction |
| Min Contour Points | 50 | Removes small contours |
| Distance Threshold | 3.0 | Maximum distance deviation |
| Max Bad Points | 5 | Circle acceptance rule |

### How to Tune the Parameters

**Too many false circles**
- Increase `min_contour_points`
- Reduce `max_bad_points`
- Adjust Canny thresholds

**Real circles are missed**
- Reduce `min_contour_points`
- Increase `max_bad_points`
- Increase `distance_threshold`
- Improve lighting and image contrast

---

## 📁 Repository Structure

```text
CircleVision-OpenCV/
│
├── backend/
│   ├── __init__.py
│   ├── main.py
│   ├── circle_detector.py
│   ├── models.py
│   ├── config.py
│   └── requirements.txt
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api.ts
│       └── styles.css
│
├── .gitignore
├── LICENSE
└── README.md
```

---

## 💻 Requirements

**Backend**
- Python 3.10+
- pip
- OpenCV
- NumPy
- FastAPI
- Uvicorn

**Frontend**
- Node.js 18+
- npm
- A modern browser such as Chrome, Edge, Firefox or Safari is recommended

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/CircleVision-OpenCV.git
cd CircleVision-OpenCV
```

### 2. Create Python virtual environment

**Windows:**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Linux/macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install backend dependencies

```bash
python -m pip install -r requirements.txt
```

### 4. Start FastAPI

From the project root:

```bash
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Backend:
```text
http://127.0.0.1:8000
```

API documentation:
```text
http://127.0.0.1:8000/docs
```

### 5. Install frontend dependencies

Open another terminal:

```bash
cd frontend
npm install
```

### 6. Start frontend

```bash
npm run dev
```

Open the URL shown by Vite, normally:
```text
http://localhost:5173
```

---

## 🔌 API Endpoints

### Health Check

```http
GET /api/health
```

Returns:
```json
{
  "status": "ok",
  "service": "circle-detection"
}
```

### Detect Base64 Image

```http
POST /api/detect
```

Request:
```json
{
  "image": "data:image/jpeg;base64,...",
  "settings": {
    "canny_low": 80,
    "canny_high": 240,
    "median_kernel": 5,
    "min_contour_points": 50,
    "distance_threshold": 3,
    "max_bad_points": 5
  }
}
```

### Upload Image

```http
POST /api/detect/upload
```

The endpoint accepts an uploaded image and configurable detection parameters.

### Webcam Detection

```http
POST /api/webcam/detect
```

Accepts an image frame using the same detection pipeline.

---

## 🧪 Example

Input:
```text
        ○       ○

            □

        ○       ○
```

The algorithm evaluates every useful contour. Expected classification:

```text
Circle 1  → PASS
Circle 2  → PASS
Rectangle → REJECT
Circle 3  → PASS
Circle 4  → PASS
```

Result:
```text
Detected circles = 4
```

---

## ❌ Why We Do Not Use HoughCircles

A normal OpenCV implementation could use:

```python
cv2.HoughCircles(...)
```

But this project intentionally avoids that function. The purpose is to demonstrate:

```text
Contour Detection
       +
Center Estimation
       +
Euclidean Geometry
       +
Statistical Deviation
       =
Circle Detection
```

This makes the project useful for learning image processing, computer vision, contours, coordinate geometry and algorithm design.

---

## ⚠️ Limitations

The geometric method can be affected by:

- **Perspective** — a circle viewed at an angle may appear elliptical
- **Poor lighting** — weak edges can prevent proper contour formation
- **Shadows** — shadows can create unwanted contours
- **Occlusion** — a partially hidden circle may not produce a complete boundary
- **Multiple touching objects** — touching or overlapping contours may be treated as one object
- **Noisy backgrounds** — complex backgrounds can create additional contours

---

## 🔧 Troubleshooting

**Backend does not start**

Check:
```bash
python --version
pip install -r backend/requirements.txt
```

Then:
```bash
uvicorn backend.main:app --reload --port 8000
```

**Frontend cannot connect to backend**

Make sure FastAPI is running at:
```text
http://127.0.0.1:8000
```

The frontend uses `VITE_API_URL` if a different backend URL is required. Example:
```bash
VITE_API_URL=http://192.168.1.10:8000 npm run dev
```

**No circle detected**

Try:
- Better lighting
- Higher contrast
- Lower minimum contour points
- Higher distance threshold
- Adjust Canny thresholds

**Too many detections**

Try:
- Increasing minimum contour points
- Lowering maximum bad points
- Improving background
- Adjusting Canny thresholds

---

## 🔐 Privacy

Images sent through the application are processed by the configured local FastAPI service. For a local development setup:

```text
Browser → Local FastAPI → OpenCV → Browser
```

No external computer-vision service or API key is required.

If the application is deployed to a public server, image data sent to that server should be treated according to that deployment's privacy policy.

---

## 🎓 Educational Objectives

This project demonstrates:

- Digital image representation
- Grayscale conversion
- Noise filtering
- Edge detection
- Contour extraction
- Geometric center estimation
- Euclidean distance
- Mean-distance analysis
- Threshold-based classification
- REST API development
- React frontend integration
- Full-stack computer-vision application design

---

## 👨‍💻 Team Responsibilities

**Tukaram Pagade**
- Project coordination
- Circle-detection algorithm
- OpenCV integration
- System integration
- Final testing

**Aditi Patil**
- React frontend
- UI/UX design
- Responsive interface
- Image upload interaction

**Samarth Sunthakar**
- FastAPI backend
- API endpoints
- Request/response models
- Backend integration

**Prajwal Gadivaddar**
- Testing
- Parameter validation
- Documentation
- Performance and edge-case testing

---

## 🗺️ Future Improvements

Possible future upgrades:

- Improved circle fitting using least-squares geometry
- Radius consistency scoring
- Circularity metric
- Contour hierarchy analysis
- Object tracking for live video
- Real-time FPS optimization
- Better handling of partial circles
- Perspective correction
- Multiple-object classification
- Exportable detection reports
- Docker deployment
- Automated unit and integration tests

---

## 📜 License

This project is released under the MIT License. See [LICENSE](./LICENSE) for details.

---

## ⭐ Project Summary

CircleVision combines computer vision, geometry and web development into one practical application. The key principle is:

```text
A circle has a center,
and its boundary points are approximately
the same distance from that center.
Short version — every time you want to run the project

Terminal 1:

cd "C:\Users\tukar\OneDrive\Desktop\OpenCV-Circle-Detection"
.\venv\Scripts\Activate.ps1
uvicorn backend.main:app --reload

Terminal 2:

cd "C:\Users\tukar\OneDrive\Desktop\OpenCV-Circle-Detection\frontend"
npm run dev
```

That simple mathematical property forms the foundation of the detection algorithm.