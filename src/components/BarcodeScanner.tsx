import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library"; // ✅ Correct import
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
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    const startScanner = async () => {
      try {
        const codeReader = new BrowserMultiFormatReader();
        codeReaderRef.current = codeReader;

        // Ask browser for camera permissions
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Decode continuously from the stream
        codeReader.decodeFromVideoDevice(null, videoRef.current!, (result, err) => {
          if (result) {
            console.log("✅ Barcode detected:", result.getText());
            onDetected(result.getText());
          }
          if (err && !(err instanceof (window as any).ZXing.NotFoundException)) {
            console.warn("Decode error:", err);
          }
        });

        setIsLoading(false);
      } catch (err) {
        console.error("Camera error:", err);
        setError("Unable to access camera. Please allow permissions.");
        setIsLoading(false);
      }
    };

    startScanner();

    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
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
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 bg-background/20 hover:bg-background/40"
          onClick={onClose}
        >
          <X className="h-6 w-6 text-white" />
        </Button>

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

        {error && (
          <div className="text-center text-white p-8">
            <p className="text-lg text-destructive mb-4">{error}</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        )}

        <div className="relative rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className={`w-full rounded-lg ${isLoading || error ? "hidden" : ""}`}
            style={{ maxHeight: "70vh" }}
          />

          {!isLoading && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 pointer-events-none"
            >
              <div className="absolute inset-0 border-4 border-primary/50 rounded-lg" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-primary rounded-lg" />
              <p className="absolute bottom-4 left-0 right-0 text-center text-white bg-black/50 py-2">
                Position barcode in the frame
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
