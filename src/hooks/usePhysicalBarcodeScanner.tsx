import { useEffect, useRef } from "react";

interface UsePhysicalBarcodeScannerProps {
  onDetected: (barcode: string) => void;
  enabled?: boolean;
  minLength?: number;
  timeout?: number;
}

/**
 * Hook to capture input from physical barcode scanners
 * Physical scanners typically act as keyboard input devices
 * that rapidly type characters followed by Enter
 */
export const usePhysicalBarcodeScanner = ({
  onDetected,
  enabled = true,
  minLength = 3,
  timeout = 100, // ms between characters to consider it a barcode scan
}: UsePhysicalBarcodeScannerProps) => {
  const barcodeBuffer = useRef<string>("");
  const lastInputTime = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastInputTime.current;

      // If too much time has passed, reset the buffer
      // This distinguishes between scanner input (rapid) and manual typing (slow)
      if (timeDiff > timeout) {
        barcodeBuffer.current = "";
      }

      lastInputTime.current = currentTime;

      // Handle Enter key - this typically signals the end of a barcode scan
      if (event.key === "Enter" && barcodeBuffer.current.length >= minLength) {
        event.preventDefault();
        const barcode = barcodeBuffer.current.trim();
        if (barcode) {
          console.log("Physical barcode scanner detected:", barcode);
          onDetected(barcode);
        }
        barcodeBuffer.current = "";
        return;
      }

      // Ignore modifier keys and special keys
      if (
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey
      ) {
        event.preventDefault();
        barcodeBuffer.current += event.key;

        // Clear the timeout if it exists
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Set a new timeout to clear the buffer if no more input comes
        timeoutRef.current = setTimeout(() => {
          barcodeBuffer.current = "";
        }, timeout * 2);
      }
    };

    // Add event listener to window to capture all keyboard input
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, onDetected, minLength, timeout]);
};
