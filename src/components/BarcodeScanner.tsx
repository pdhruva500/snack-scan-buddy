import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

export default function BarcodeScanner({ onDetected }) {
  const videoRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    const startScanner = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === "videoinput");

        if (videoDevices.length === 0) {
          setErrorMessage("No camera found on this device.");
          setLoading(false);
          return;
        }

        const selectedDeviceId = videoDevices[0].deviceId;

        await codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result, err) => {
            if (result) {
              onDetected(result.getText());
            }
            if (err && !(err.name === "NotFoundException")) {
              console.error("Scanner error:", err);
            }
          }
        );

        setLoading(false);
      } catch (err) {
        console.error("Camera access error:", err);
        if (err.name === "NotAllowedError") {
          setErrorMessage("Camera access was denied. Please enable permissions.");
        } else if (err.name === "NotFoundError") {
          setErrorMessage("No suitable camera found.");
        } else {
          setErrorMessage("Failed to access camera. Please try again.");
        }
        setLoading(false);
      }
    };

    startScanner();

    return () => {
      codeReader.reset();
    };
  }, [onDetected]);

  return (
    <div className="flex flex-col items-center justify-center text-white">
      {loading && <p className="text-gray-300">Loading camera...</p>}
      {errorMessage && (
        <p className="text-red-400 mt-2 text-center">{errorMessage}</p>
      )}
      <video
        ref={videoRef}
        style={{
          width: "100%",
          maxWidth: "500px",
          borderRadius: "1rem",
          marginTop: "1rem",
        }}
      />
    </div>
  );
}
