import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { motion } from "framer-motion";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
  disabled?: boolean;
}

export const BarcodeScanner = ({ onDetected, onClose, disabled = false }: BarcodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    let mounted = true;
    const startScanner = async () => {
      if (disabled) {
        // When disabled, do not request camera or start decoding.
        setIsLoading(false);
        return;
      }
      try {
        const codeReader = new BrowserMultiFormatReader();
        readerRef.current = codeReader;

        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        
        if (videoInputDevices.length === 0) {
          setError("No camera found on this device");
          setIsLoading(false);
          return;
        }

        // Prefer back camera on mobile
        const selectedDevice = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back')
        ) || videoInputDevices[0];

        // Add constraints for better video quality and performance
        const constraints = {
          video: {
            deviceId: selectedDevice.deviceId,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "environment",
          }
        };

        // First set up the video stream
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current && mounted) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Then start the barcode detection
        if (mounted) {
          await codeReader.decodeFromVideoDevice(
            selectedDevice.deviceId,
            videoRef.current!,
            (result) => {
              if (result && mounted) {
                const barcode = result.getText();
                if (barcode && barcode.length > 0) {
                  const cleaned = barcode.trim();
                  // Ignore single-digit numeric results (likely noise)
                  if (/^\d$/.test(cleaned)) {
                    return;
                  }
                  onDetected(cleaned);
                }
              }
            }
          );
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Scanner error:", err);
        if (mounted) {
          let errorMessage = "Failed to access camera. ";
          if (err instanceof Error) {
            if (err.name === 'NotAllowedError') {
              errorMessage += "Camera permission was denied. Please allow camera access in your browser settings.";
            } else if (err.name === 'NotFoundError') {
              errorMessage += "No camera found on this device.";
            } else if (err.name === 'NotReadableError') {
              errorMessage += "Camera is already in use by another application.";
            } else {
              errorMessage += err.message;
            }
          } else {
            errorMessage += "Please grant camera permissions in your browser.";
          }
          setError(errorMessage);
          setIsLoading(false);
        }
      }
    };

    startScanner();

    // Cleanup function (runs when component unmounts)
    return () => {
      mounted = false;
      if (readerRef.current) {
        try {
          const stream = videoRef.current?.srcObject as MediaStream | null;
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
          readerRef.current = null;
        } catch (e) {
          console.error("Error stopping scanner:", e);
        }
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
          onClick={() => {
            // ✅ Stop the camera immediately when closing
            const stream = videoRef.current?.srcObject as MediaStream | null;
            if (stream) {
              stream.getTracks().forEach(track => track.stop());
            }
            if (videoRef.current) {
              videoRef.current.srcObject = null;
            }
            readerRef.current = null;

            // Then trigger parent close
            onClose();
          }}
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
          {disabled ? (
            <div className="w-full rounded-lg bg-black/60 text-white flex items-center justify-center" style={{ height: '60vh' }}>
              <div className="text-center px-4">
                <Camera className="h-16 w-16 mx-auto mb-4 opacity-60" />
                <p className="text-lg opacity-80">Scanner disabled during restricted hours</p>
                <p className="text-sm opacity-60 mt-2">You can close this window and try again later.</p>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className={`w-full rounded-lg ${isLoading || error ? 'hidden' : ''}`}
                style={{ maxHeight: '70vh' }}
                autoPlay
                playsInline
                muted
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
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};
