interface ImageResultProps {
  label: string;
  src: string;
}

export default function ImageResult({ label, src }: ImageResultProps) {
  return (
    <div className="image-result">
      <div className="image-result-label">{label}</div>
      <div className="image-result-frame">
        <img src={src} alt={label} />
      </div>
    </div>
  );
}
