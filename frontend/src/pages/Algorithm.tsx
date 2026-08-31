interface Step {
  title: string;
  description: string;
  formula?: string;
}

const STEPS: Step[] = [
  {
    title: "1. Grayscale Conversion",
    description: "The input BGR image is converted to a single-channel grayscale image, simplifying all further processing.",
  },
  {
    title: "2. Median Filtering",
    description: "A median blur removes salt-and-pepper noise while preserving edges better than a mean filter would.",
  },
  {
    title: "3. Canny Edge Detection",
    description: "Canny detects strong edges using two thresholds (Canny Low / Canny High), producing a binary edge map.",
  },
  {
    title: "4. Contour Detection",
    description: "cv2.findContours() extracts external contours from the edge map — each contour is a candidate shape.",
  },
  {
    title: "5. Minimum Area Rectangle",
    description: "cv2.minAreaRect() fits the smallest rotated rectangle around each contour, giving a center, width, and height.",
  },
  {
    title: "6. Center Calculation",
    description: "The rectangle's center point (center_x, center_y) is used as the estimated center of the potential circle.",
  },
  {
    title: "7. Distance Calculation",
    description: "For every point on the contour, the Euclidean distance to the rectangle's center is computed.",
    formula: "distance = sqrt((x - center_x)^2 + (y - center_y)^2)",
  },
  {
    title: "8. Mean Distance",
    description: "The average of all point distances approximates the circle's radius if the contour is truly circular.",
    formula: "mean_distance = sum(distances) / number_of_points",
  },
  {
    title: "9. Abnormal Point Detection",
    description: "Any point whose distance deviates from the mean by more than the Distance Threshold is flagged as abnormal.",
    formula: "abnormal if abs(distance - mean_distance) > 3",
  },
  {
    title: "10. Circle Classification",
    description: "If the number of abnormal points is below Maximum Bad Points, the contour is classified as a circle.",
    formula: "circle if bad_points < 5",
  },
];

export default function Algorithm() {
  return (
    <div className="page">
      <h1 className="page-title">Algorithm</h1>
      <p className="page-subtitle">
        Step-by-step explanation of the contour + minAreaRect + center-distance method used instead of
        cv2.HoughCircles().
      </p>

      <div className="algorithm-steps">
        {STEPS.map((step) => (
          <div className="algorithm-step" key={step.title}>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
            {step.formula && <code className="algorithm-formula">{step.formula}</code>}
          </div>
        ))}
      </div>

      <section className="limitations-section">
        <h2 className="section-title">Requirements &amp; Limitations</h2>
        <p>The algorithm works best when:</p>
        <ul>
          <li>Camera is approximately parallel to the target surface.</li>
          <li>Lighting is uniform.</li>
          <li>Shadows are minimized.</li>
          <li>Circles are clearly visible.</li>
          <li>Occlusion is limited.</li>
          <li>Image is reasonably clear.</li>
        </ul>
        <div className="limitations-grid">
          <div className="limitation-card">
            <h4>Perspective Distortion</h4>
            <p>A camera angled relative to the object turns circles into ellipses, breaking the constant-radius assumption.</p>
          </div>
          <div className="limitation-card">
            <h4>Shadows</h4>
            <p>Heavy shadows create extra edges and therefore extra (false) contours.</p>
          </div>
          <div className="limitation-card">
            <h4>Occlusion</h4>
            <p>A partially blocked circle produces a broken contour, which usually fails the abnormal-point test.</p>
          </div>
          <div className="limitation-card">
            <h4>Noise</h4>
            <p>Excess image noise can create small false contours that are mistaken for circles if size filters are too loose.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
