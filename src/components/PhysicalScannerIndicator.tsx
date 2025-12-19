import { motion } from "framer-motion";
import { Scan, Wifi } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PhysicalScannerIndicatorProps {
  isActive: boolean;
  lastScan?: string;
}

export const PhysicalScannerIndicator = ({ 
  isActive, 
  lastScan 
}: PhysicalScannerIndicatorProps) => {
  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-20 right-4 z-40"
    >
      <Card className="border-2 border-primary/50 bg-background/95 backdrop-blur-sm shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Wifi className="h-5 w-5 text-primary" />
            </motion.div>
            <CardTitle className="text-base">Physical Scanner</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Ready to scan barcodes
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Active
            </Badge>
            <Scan className="h-4 w-4 text-muted-foreground" />
          </div>
          {lastScan && (
            <p className="text-xs text-muted-foreground mt-2">
              Last: {lastScan.substring(0, 10)}...
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
