# Quick Testing Guide

## 🚀 Ready to Test!

Your snack scanner system has been updated with comprehensive multi-scan support. Here's how to test:

### Dev Server
**Already running at:** http://localhost:8081

---

## 🎯 Quick Test Flows

### Test 1: Basic Multi-Scan (2 minutes)
1. Open homepage
2. Type your name: "Test Student"
3. Scan a barcode (or type "Chips")
4. See chip appear with X button ✅
5. Scan another barcode (or type "Cookie")  
6. See second chip appear ✅
7. Click Submit
8. Go to Admin view → verify both items logged ✅

### Test 2: Remove Scans (1 minute)
1. Scan 3 items
2. Click X on middle chip
3. Verify it disappears ✅
4. Click X on remaining chips
5. Type manual entry
6. Submit → verify only manual entry logged ✅

### Test 3: Cross-Page Scanning (2 minutes)
1. On homepage: scan 1 item → see chip ✅
2. Click scan button → goes to /simple-scan
3. On scanner page: scan another item
4. Click "Log Snack" → returns to homepage
5. Verify: BOTH items show as chips ✅
6. Fill name → submit → check admin ✅

### Test 4: Typing Test (1 minute)
1. Click into "First Name" field
2. Type "John" slowly
3. Verify: Letters appear normally ✅
4. Use physical barcode scanner
5. Verify: Barcode captured, NOT typed into field ✅
6. Continue typing "Doe" in Last Name
7. Verify: Can type normally ✅

### Test 5: Navigation Persistence (1 minute)
1. Type first name
2. Scan an item
3. Navigate to Admin view
4. Click back to homepage
5. Verify: Name and scanned chip still there ✅

---

## 🐛 Try to Break It!

### Edge Cases to Test:
- ❓ Scan same item 5 times → should create 5 chips
- ❓ Remove all scans → can still submit manual entry?
- ❓ Scan invalid barcode → error shown, no chip created?
- ❓ Submit with only scans (no manual entry) → works?
- ❓ Submit with only manual (no scans) → works?
- ❓ Scan 10+ items → chips wrap properly?
- ❓ Long product names → display correctly?
- ❓ Physical scanner rapid fire → all captured?

---

## 📊 Check Admin View

After logging items, verify in Admin:
- ✅ All items appear as separate entries
- ✅ Scanned items show "(Scanned)" indicator
- ✅ Correct student name on all entries
- ✅ Timestamps are accurate
- ✅ Can cross out / undo
- ✅ Can delete individual entries
- ✅ Charts update correctly

---

## 🔍 What to Look For

### ✅ Good Signs:
- Can type normally in all fields
- Scans create chips with X buttons
- Multiple scans all show up
- Chips survive page navigation
- Submit logs all items correctly
- Remove X button works for each chip

### ❌ Report These Issues:
- Can't type in input fields
- Barcodes typed into fields instead of captured
- Scans disappear when navigating
- Chips don't show X button
- Submit only logs one item instead of all
- Error messages when they shouldn't appear

---

## 📝 Full Test Plan

See [TESTING_SCENARIOS.md](./TESTING_SCENARIOS.md) for all 41 test scenarios

---

## 💡 Tips

1. **Physical Scanner:** Works best with USB barcode scanners (acts like keyboard)
2. **Camera Scanner:** Click "Open Camera Scanner" on /simple-scan page
3. **Clear Draft:** Clearing browser session storage will reset draft
4. **Admin PIN:** Default is `4321`

---

## 🆘 Common Issues

**Can't type in fields?**
→ Make sure physical scanner isn't continuously scanning

**Scans not showing up?**
→ Check browser console for errors (F12)

**Nothing happens on scan?**
→ Verify barcode is in OpenFoodFacts database

**Chips don't appear on homepage after scanner page?**
→ Make sure you clicked "Log Snack" not just "Add & Scan Another"

---

Happy testing! 🎉
