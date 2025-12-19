# Physical Barcode Scanner Integration

This document explains how the physical barcode scanner feature works alongside the existing camera-based scanner.

## Overview

The app now supports **two scanning methods**:
1. **Camera-based scanning** (original feature) - Uses your device's camera with ZXing library
2. **Physical barcode scanner** (new feature) - Uses USB/Bluetooth barcode scanner devices

Both methods work independently and use the same product lookup functionality.

## How It Works

### Physical Scanner Behavior

Physical barcode scanners typically act as **keyboard input devices**. When you scan a barcode:
1. The scanner rapidly "types" the barcode digits
2. The scanner sends an "Enter" key to signal completion
3. Our hook (`usePhysicalBarcodeScanner`) captures this rapid input
4. The barcode is processed just like a camera scan

### Key Features

- **Automatic Detection**: No configuration needed - just scan!
- **Visual Indicator**: Green badge in top-right shows scanner is active
- **Same Product Lookup**: Uses identical API as camera scanner
- **Non-Intrusive**: Doesn't interfere with normal typing or camera scanning

## Implementation Details

### Files Added

1. **`src/hooks/usePhysicalBarcodeScanner.tsx`**
   - Custom React hook that listens for keyboard events
   - Distinguishes between barcode scans (rapid input) and manual typing (slow input)
   - Configurable timeout and minimum length

2. **`src/components/PhysicalScannerIndicator.tsx`**
   - Visual indicator showing scanner status
   - Displays last scanned barcode (partial)
   - Animated to show active state

### Files Modified

1. **`src/pages/Index.tsx`**
   - Added physical scanner hook integration
   - Added `handlePhysicalBarcodeDetected` function
   - Added scanner indicator component
   - All original camera scanning features remain unchanged

## Configuration

The physical scanner can be configured via the hook parameters:

```typescript
usePhysicalBarcodeScanner({
  onDetected: handlePhysicalBarcodeDetected,
  enabled: true,        // Enable/disable scanner
  minLength: 5,        // Minimum barcode length (default: 3)
  timeout: 100,        // ms between keypresses to consider it a scan (default: 100)
});
```

## Testing Your Scanner

1. **Login** to the app
2. Look for the **green "Physical Scanner Active"** badge in the top-right
3. Point your physical scanner at a barcode
4. Press the scan button on your device
5. The product should appear automatically!

### Troubleshooting

**Scanner not working?**
- Ensure the scanner is in "keyboard emulation" mode (most common default)
- Check that the scanner sends an "Enter" key after each scan
- Verify the scanner is properly connected (USB/Bluetooth)
- Check browser console for "Physical barcode scanner detected:" logs

**False positives?**
- Increase the `minLength` parameter
- Adjust the `timeout` parameter (lower = more strict)

## Compatibility

### Tested Scanners
- Sky Barcode Scanner ✅
- Generic USB barcode scanners (keyboard mode)
- Bluetooth HID barcode scanners

### Scanner Requirements
- Must operate in **keyboard emulation/HID mode**
- Should send **Enter key** after barcode
- Compatible with standard UPC/EAN barcodes

## User Experience

### Original Camera Scanner
- Click "Scan a Snack" button
- Camera modal opens
- Point at barcode
- Auto-detects and closes

### Physical Scanner (NEW)
- No button needed!
- Just point and scan
- Instant product lookup
- Works from anywhere on the page

## Future Enhancements

Potential improvements for future versions:
- [ ] Toggle to disable physical scanner
- [ ] Scanner settings in user preferences
- [ ] Support for QR codes via physical scanner
- [ ] Sound/haptic feedback on successful scan
- [ ] Scan history/counter in indicator
- [ ] Multi-barcode batch scanning mode

## Technical Notes

### Why This Approach?

Physical barcode scanners are fundamentally keyboard input devices. This implementation:
- **No drivers needed**: Works with any keyboard-mode scanner
- **Browser compatible**: Pure JavaScript, no native APIs
- **Universal**: Works on desktop, tablets, and touch devices with USB/BT support
- **Lightweight**: No additional dependencies

### Event Handling

The hook uses a global `keydown` event listener that:
1. Buffers rapid keypresses (< 100ms apart)
2. Prevents default behavior to avoid typing in inputs
3. Triggers callback on Enter key
4. Auto-clears buffer after timeout

### Edge Cases Handled

- Scanner input during form typing (prevented)
- Multiple rapid scans (debounced)
- Partial scans / interrupted input (timeout cleanup)
- User navigates away (cleanup on unmount)

## Security Considerations

- Physical scanner input is treated like manual input
- Same authentication/authorization checks apply
- Time restrictions still enforced
- No privileged access granted by using physical scanner

---

**Note**: This feature is completely additive - all original scanning functionality remains intact and unchanged.
