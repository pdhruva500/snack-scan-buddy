import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { motion } from "framer-motion";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

export const BarcodeScanner = ({ onDetected, onClose }: BarcodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    const startScanner = async () => {
      try {
        const codeReader = new BrowserMultiFormatReader();
        readerRef.current = codeReader;

        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (devices.length === 0) {
          setError("No camera found on this device");
          setIsLoading(false);
          return;
        }

        // Prefer back camera on mobile
        const selectedDevice =
          devices.find((d) => d.label.toLowerCase().includes("back")) || devices[0];

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: selectedDevice.deviceId },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setIsLoading(false);
        setScanning(true);

        // controlled scan loop to prevent freezing
        const scan = async () => {
          if (!readerRef.current || !videoRef.current) return;
          try {
            const result = await readerRef.current.decodeOnceFromVideoElement(
              videoRef.current
            );
            if (result) {
              console.log("Barcode detected:", result.getText());
              onDetected(result.getText());
              setScanning(false);
            }
          } catch (err) {
            // retry in 500ms if no result
            if (scanning) setTimeout(scan, 500);
          }
        };

        scan();
      } catch (err) {
        console.error("Scanner error:", err);
        setError("Failed to access camera. Please grant camera permissions.");
        setIsLoading(false);
      }
    };

    startScanner();

    return () => {
      if (readerRef.current) {
        const stream = videoRef.current?.srcObject as MediaStream;
        if (stream) stream.getTracks().forEach((track) => track.stop());
      }
      setScanning(false);
    };
  }, [onDetected]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
    >
      <div className="relative w-full max-w-2xl mx-4">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 bg-background/20 hover:bg-background/40"
          onClick={onClose}
        >
          <X className="h-6 w-6 text-white" />
        </Button>

        {/* Loading state */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center text-white p-8"
          >
            <Camera className="h-16 w-16 mx-auto mb-4 animate-pulse" />
            <p className="text-lg">Opening camera...</p>
          </motion.div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center text-white p-8">
            <p className="text-lg text-destructive mb-4">{error}</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        )}

        {/* Camera view */}
        <div className="relative rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className={`w-full rounded-lg ${isLoading || error ? "hidden" : ""}`}
            style={{ maxHeight: "70vh" }}
          />

          {/* Overlay */}
          {!isLoading && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 pointer-events-none"
            >
              <div className="absolute inset-0 border-4 border-primary/50 rounded-lg" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-primary rounded-lg" />

              <p className="absolute bottom-4 left-0 right-0 text-center text-white bg-black/50 py-2">
                {scanning
                  ? "Scanning... Hold steady"
                  : "Position barcode in the frame"}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
