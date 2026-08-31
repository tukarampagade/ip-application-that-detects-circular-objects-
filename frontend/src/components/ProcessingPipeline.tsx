import ImageResult from "./ImageResult";
import type { DetectionImages } from "../types/detection";

interface ProcessingPipelineProps {
  images: DetectionImages;
}

export default function ProcessingPipeline({ images }: ProcessingPipelineProps) {
  return (
    <div className="pipeline-grid">
      <ImageResult label="Original" src={images.original} />
      <ImageResult label="Grayscale" src={images.grayscale} />
      <ImageResult label="Median Filter" src={images.median} />
      <ImageResult label="Canny Edges" src={images.canny} />
      <ImageResult label="Detected Circles" src={images.output} />
    </div>
  );
}
