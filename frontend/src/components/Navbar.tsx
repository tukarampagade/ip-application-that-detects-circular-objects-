import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/detect", label: "Image Detection" },
  { to: "/camera", label: "Live Camera" },
  { to: "/algorithm", label: "Algorithm" },
  { to: "/about", label: "About" },
];

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">◎</span>
        <div>
          <div className="navbar-title">OpenCV Circle Detection</div>
          <div className="navbar-subtitle">Contour-Based · No Hough Transform</div>
        </div>
      </div>
      <nav className="navbar-links">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) => "navbar-link" + (isActive ? " active" : "")}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
