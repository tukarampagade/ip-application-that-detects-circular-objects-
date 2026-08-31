import { useState } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import ImageDetection from "./pages/ImageDetection";
import LiveCamera from "./pages/LiveCamera";
import Algorithm from "./pages/Algorithm";
import About from "./pages/About";
import type { DetectionResponse } from "./types/detection";
import "./styles/global.css";

export default function App() {
  const [lastResult, setLastResult] = useState<DetectionResponse | null>(null);

  return (
    <HashRouter>
      <div className="app-shell">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard lastResult={lastResult} />} />
            <Route path="/detect" element={<ImageDetection onResult={setLastResult} />} />
            <Route path="/camera" element={<LiveCamera onResult={setLastResult} />} />
            <Route path="/algorithm" element={<Algorithm />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
