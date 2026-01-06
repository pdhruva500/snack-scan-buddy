# Comprehensive Testing Scenarios for Snack Scanner

## Overview
This document outlines all possible user scenarios to ensure the system functions correctly in every situation.

## ✅ Core Functionality Tests

### 1. Basic Single Scan Flow
- [ ] User scans one item on homepage → fills name → submits
- [ ] Verify: Item appears in admin logs with correct barcode
- [ ] Verify: Form clears after submission
- [ ] Verify: Confirmation banner shows correct info

### 2. Manual Entry Flow
- [ ] User types name manually (no scan) → submits
- [ ] Verify: Item appears in admin logs without barcode
- [ ] Verify: Can type normally in all input fields

### 3. Multiple Scans on Homepage
- [ ] Scan item 1 → see it appear as chip
- [ ] Scan item 2 → see both chips
- [ ] Scan item 3 → see all three chips
- [ ] Submit → verify all 3 items logged
- [ ] Verify: All items associated with same student name

### 4. Scanner Page Flow
- [ ] Navigate to scanner page (/simple-scan)
- [ ] Scan item → see product display
- [ ] Click "Log Snack" → returns to homepage
- [ ] Verify: Scanned item appears as chip on homepage
- [ ] Fill name → submit → verify logged

### 5. Multiple Scans Across Pages
- [ ] Scan item 1 on homepage → see chip
- [ ] Navigate to scanner page
- [ ] Scan item 2 on scanner page
- [ ] Return to homepage
- [ ] Verify: BOTH items show as chips
- [ ] Submit → verify both logged

### 6. Removing Scanned Items
- [ ] Scan 3 items (get 3 chips)
- [ ] Click X on middle chip
- [ ] Verify: Item removed, other 2 remain
- [ ] Click X on remaining items one by one
- [ ] Verify: All can be removed
- [ ] Verify: Can still submit manual entry after removing all scans

### 7. Mixed Manual + Scanned
- [ ] Type manual food name
- [ ] Scan 2 items
- [ ] Verify: All 3 items will be logged
- [ ] Submit → verify 3 separate log entries

## 🔄 Navigation & Persistence Tests

### 8. Draft Persistence - Homepage to Scanner
- [ ] Fill in first name on homepage
- [ ] Navigate to scanner page
- [ ] Return to homepage
- [ ] Verify: First name still filled in

### 9. Draft Persistence - Scans Survive Navigation
- [ ] Scan item on homepage
- [ ] Navigate away (to admin, then back)
- [ ] Verify: Scanned item chip still present

### 10. Scanner Page "Scan Another"
- [ ] Go to scanner page
- [ ] Scan item 1 → click "Add & Scan Another"
- [ ] Scan item 2 → click "Add & Scan Another"
- [ ] Scan item 3 → click "Log Snack"
- [ ] Verify: All 3 items appear on homepage as chips

### 11. Back Button Navigation
- [ ] Fill form partially on homepage
- [ ] Click scan button → goes to scanner
- [ ] Click "Back" button on scanner
- [ ] Verify: Form data preserved

## ⚡ Physical Scanner Tests

### 12. Physical Scanner on Homepage (Input Focused)
- [ ] Click into "First Name" field (input focused)
- [ ] Use physical barcode scanner
- [ ] Verify: Barcode NOT typed into input field
- [ ] Verify: Item appears as chip instead
- [ ] Verify: Can still type name normally

### 13. Physical Scanner Rapid Fire
- [ ] Scan 5 items rapidly one after another
- [ ] Verify: All 5 items captured as separate chips
- [ ] Verify: No duplicate scans
- [ ] Verify: Can submit all 5

### 14. Physical Scanner vs Manual Typing
- [ ] Start typing "Apple" slowly in food field
- [ ] Verify: Letters appear normally (not intercepted)
- [ ] Use physical scanner (rapid input)
- [ ] Verify: Scanner input intercepted and creates chip

## 🎯 Edge Cases & Error Handling

### 15. Empty Submission
- [ ] Leave all fields empty → click submit
- [ ] Verify: Error message "Please enter your name"
- [ ] Fill name only → click submit
- [ ] Verify: Error message "Please scan or enter a food item"

### 16. Unknown Barcode
- [ ] Scan invalid/unknown barcode
- [ ] Verify: Error toast "Product not found"
- [ ] Verify: No chip created
- [ ] Verify: Can continue using app

### 17. Duplicate Scans
- [ ] Scan same item twice
- [ ] Verify: Two separate chips appear (allowed)
- [ ] Submit → verify 2 log entries

### 18. Remove All Scans Then Add Manual
- [ ] Scan 2 items
- [ ] Remove both with X button
- [ ] Type manual food name
- [ ] Submit → verify manual entry logged

### 19. Submit With Only Scans (No Manual Entry)
- [ ] Scan 2 items
- [ ] Leave manual food field empty
- [ ] Fill name → submit
- [ ] Verify: Only 2 scanned items logged

### 20. Submit With Only Manual (No Scans)
- [ ] Type manual food name
- [ ] Fill name → submit
- [ ] Verify: Only manual entry logged

## 🔒 Time Restriction Tests

### 21. Scanning During Lunch Hours
- [ ] (If during restricted lunch hours)
- [ ] Verify: Scan button disabled
- [ ] Verify: Physical scanner disabled
- [ ] Verify: Error message displayed

### 22. Scanning Outside Lunch Hours
- [ ] (If outside restricted hours)
- [ ] Verify: All scanner features work normally

## 📊 Admin View Tests

### 23. Admin View - All Logs Display
- [ ] Log 3 items as Student A
- [ ] Log 2 items as Student B
- [ ] Go to admin view
- [ ] Verify: All 5 logs visible
- [ ] Verify: Correct names, items, timestamps

### 24. Admin View - Scanned vs Manual Indicator
- [ ] Log one scanned item
- [ ] Log one manual item
- [ ] Check admin view
- [ ] Verify: Scanned item shows "(Scanned)" indicator

### 25. Admin View - Cross Out/Undo
- [ ] Cross out a log entry
- [ ] Verify: Entry shows as crossed out
- [ ] Verify: Remaining count updates
- [ ] Undo cross out
- [ ] Verify: Entry restored

### 26. Admin View - Delete Entry
- [ ] Delete a log entry
- [ ] Verify: Entry permanently removed
- [ ] Verify: Total count updates

### 27. Admin View - Real-time Updates
- [ ] Open admin view in one tab
- [ ] Log new item from homepage (same browser)
- [ ] Verify: Admin view updates automatically

## 🔄 Session & Storage Tests

### 28. Page Refresh With Draft
- [ ] Fill form partially + scan item
- [ ] Refresh page (F5)
- [ ] Verify: Name preserved
- [ ] Verify: Scanned chips still present

### 29. Complete Flow Twice
- [ ] Log items as Student A → submit
- [ ] Immediately log items as Student B → submit
- [ ] Check admin
- [ ] Verify: Both students' entries present

### 30. Clear All Logs
- [ ] Go to admin view
- [ ] Click "Clear All Logs"
- [ ] Confirm deletion
- [ ] Verify: All logs cleared
- [ ] Verify: Total scans counter updates

## 🎨 UI/UX Tests

### 31. Chip Removal Animation
- [ ] Scan 3 items
- [ ] Click X on one chip
- [ ] Verify: Smooth fade-out animation
- [ ] Verify: Other chips adjust position smoothly

### 32. Long Food Names
- [ ] Scan item with very long product name
- [ ] Verify: Chip displays correctly (no overflow)
- [ ] Verify: Name truncated if needed

### 33. Many Items Display
- [ ] Scan 10+ items
- [ ] Verify: Chips wrap to multiple lines
- [ ] Verify: All chips accessible and removable
- [ ] Submit → verify all logged

### 34. Confirmation Banner
- [ ] Submit items
- [ ] Verify: Green confirmation banner appears
- [ ] Verify: Shows correct count and items
- [ ] Verify: Auto-dismisses after 3 seconds

### 35. Mobile Responsiveness
- [ ] Test on mobile viewport
- [ ] Verify: All buttons accessible
- [ ] Verify: Chips wrap properly
- [ ] Verify: Scanner opens correctly

## 🚀 Performance Tests

### 36. Rapid Submissions
- [ ] Submit 20 log entries rapidly
- [ ] Verify: All captured correctly
- [ ] Check admin view
- [ ] Verify: All 20 entries present

### 37. Large Log History
- [ ] Create 100+ log entries
- [ ] Open admin view
- [ ] Verify: Loads without lag
- [ ] Verify: Search works correctly

## 📱 Camera Scanner Tests

### 38. Camera Scanner Button
- [ ] Click scan button on homepage
- [ ] Verify: Opens scanner page (not camera modal)
- [ ] Scanner page: click "Open Camera Scanner"
- [ ] Verify: Camera modal opens

### 39. Camera Scanner Flow
- [ ] Go to scanner page
- [ ] Open camera scanner
- [ ] Scan barcode with camera
- [ ] Verify: Camera closes
- [ ] Verify: Product info displayed
- [ ] Click "Log Snack"
- [ ] Verify: Returns to homepage with chip

## 🔧 Browser Compatibility Tests

### 40. localStorage Persistence
- [ ] Log items → close browser completely
- [ ] Reopen → go to admin view
- [ ] Verify: Logs still present

### 41. sessionStorage Draft
- [ ] Fill form → close tab (not browser)
- [ ] Open new tab to same page
- [ ] Verify: Draft NOT carried over (expected - different session)

## Summary
Total scenarios: 41
Critical paths: 15
Edge cases: 10
UI/UX: 8
Performance: 2
Admin: 6

---

## Testing Checklist Progress
Mark each scenario as you test:
- ✅ = Passed
- ❌ = Failed (needs fix)
- ⚠️ = Partial (has issues)
- ⏭️ = Skipped (not applicable)
