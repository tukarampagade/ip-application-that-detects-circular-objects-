export default function About() {
  return (
    <div className="page">
      <h1 className="page-title">About</h1>

      <div className="about-card">
        <h2>Project</h2>
        <p>OpenCV Circle Detection Without Hough Circle</p>
      </div>

      <div className="about-card">
        <h2>Technology</h2>
        <ul className="tech-list">
          <li>Python</li>
          <li>OpenCV</li>
          <li>NumPy</li>
          <li>FastAPI</li>
          <li>React</li>
          <li>TypeScript</li>
        </ul>
      </div>

      <div className="about-card">
        <h2>Detection Method</h2>
        <p>Contour Geometry + minAreaRect + Euclidean Distance Analysis</p>
      </div>

      <div className="about-card about-card-highlight">
        <p>
          <strong>Important:</strong> Hough Circle Transform is intentionally not used.
        </p>
      </div>
    </div>
  );
}
