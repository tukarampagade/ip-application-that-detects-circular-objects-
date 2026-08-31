import { useCallback, useRef, useState } from "react";

interface ImageUploaderProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function ImageUploader({ onFileSelected, disabled }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | undefined | null) => {
      if (!file) return;
      if (!ACCEPTED_TYPES.includes(file.type)) {
        alert("Unsupported file type. Please upload a JPG, JPEG, PNG, or WEBP image.");
        return;
      }
      setFileName(file.name);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div
      className={`uploader ${isDragging ? "uploader-dragging" : ""} ${disabled ? "uploader-disabled" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files?.[0])}
        disabled={disabled}
      />
      <div className="uploader-icon">⬆</div>
      <div className="uploader-text">
        {fileName ? (
          <>
            <strong>{fileName}</strong>
            <span>Click or drop another image to replace</span>
          </>
        ) : (
          <>
            <strong>Drop an image here</strong>
            <span>or click to Browse Image (JPG, JPEG, PNG, WEBP)</span>
          </>
        )}
      </div>
    </div>
  );
}
