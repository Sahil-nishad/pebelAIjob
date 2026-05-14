# Week 1 Testing Guide - Resume Management

## 🎯 What Was Built

### Frontend Pages
1. ✅ **Resume List Page** (`/careers/resume`)
   - Grid view of all resumes
   - Upload button
   - Delete functionality
   - Stats display
   - Empty state

2. ✅ **Resume Upload Page** (`/careers/resume/upload`)
   - Drag-and-drop file upload
   - File validation (PDF/DOCX, max 10MB)
   - Upload progress indicator
   - Tips and info cards

3. ✅ **Resume Detail Page** (`/careers/resume/[id]`)
   - Overview tab (skills, experience, education, projects)
   - Raw text tab
   - Download button
   - Delete button
   - Parsing status indicator

### Backend API Routes
1. ✅ **GET /api/careers/resumes** - List all resumes
2. ✅ **POST /api/careers/resumes/upload** - Upload resume
3. ✅ **GET /api/careers/resumes/[id]** - Get single resume
4. ✅ **PATCH /api/careers/resumes/[id]** - Update resume
5. ✅ **DELETE /api/careers/resumes/[id]** - Delete resume

## 🧪 Testing Checklist

### Prerequisites
- [ ] Backend is running (`docker-compose up -d` or `uvicorn app.main:app --reload`)
- [ ] Frontend is running (`npm run dev`)
- [ ] Database migration applied
- [ ] GEMINI_API_KEY or OPENAI_API_KEY is set
- [ ] User is logged in

### Test 1: Backend API Testing

#### 1.1 Test Backend Health
```bash
cd careers-backend
python test_api.py
```

**Expected Output:**
```
✅ Health check passed
✅ Detailed health check passed
✅ API docs accessible
✅ Auth endpoint working
✅ Protected endpoint correctly requires authentication
Passed: 5/5
```

#### 1.2 Test Resume Parsing
```bash
cd careers-backend
python test_resume_parsing.py
```

**Expected Output:**
```
✅ Test 1: PDF Extraction - PASSED
✅ Test 2: AI Extraction - PASSED
✅ Test 3: ATS Matching - PASSED
3/3 tests passed
🎉 All tests passed!
```

### Test 2: Frontend Testing

#### 2.1 Test Resume List Page
1. Navigate to http://localhost:3000/careers/resume
2. **Empty State Test:**
   - [ ] See "No resumes yet" message
   - [ ] See "Upload Your First Resume" button
   - [ ] Button is styled correctly (green)

3. **Navigation Test:**
   - [ ] Click "Upload Your First Resume"
   - [ ] Should navigate to `/careers/resume/upload`

#### 2.2 Test Resume Upload Page
1. Navigate to http://localhost:3000/careers/resume/upload
2. **UI Test:**
   - [ ] See drag-drop area
   - [ ] See "Choose File" button
   - [ ] See tips section at bottom
   - [ ] See info cards (AI Parsing, Secure Storage, ATS Matching)

3. **Drag-Drop Test:**
   - [ ] Drag a PDF file over the drop area
   - [ ] Drop area should highlight (green border)
   - [ ] Drop the file
   - [ ] File preview should appear

4. **File Selection Test:**
   - [ ] Click "Choose File" button
   - [ ] Select a PDF or DOCX file
   - [ ] File preview should appear with:
     - File icon
     - File name
     - File size
     - File type

5. **Validation Test:**
   - [ ] Try uploading a .txt file → Should show error
   - [ ] Try uploading a file > 10MB → Should show error
   - [ ] Try uploading a PDF < 10MB → Should work

6. **Upload Test:**
   - [ ] Click "Upload Resume" button
   - [ ] Progress bar should appear
   - [ ] Progress should go from 0% to 100%
   - [ ] Success toast should appear
   - [ ] Should redirect to resume detail page

#### 2.3 Test Resume Detail Page
1. After upload, you should be on `/careers/resume/[id]`
2. **Header Test:**
   - [ ] See file name or parsed name
   - [ ] See upload date
   - [ ] See file size and type
   - [ ] See parsing status (green checkmark or orange alert)

3. **Actions Test:**
   - [ ] Click "Download" → Should open file in new tab
   - [ ] Click "Delete" → Should show confirmation
   - [ ] Confirm delete → Should redirect to list page

4. **Overview Tab Test:**
   - [ ] See Skills section with extracted skills
   - [ ] See Experience section with job history
   - [ ] See Education section with degrees
   - [ ] See Projects section (if any)
   - [ ] All sections should have counts

5. **Raw Text Tab Test:**
   - [ ] Click "Raw Text" tab
   - [ ] See extracted text from PDF
   - [ ] Text should be formatted in monospace font

6. **Parsing Status Test:**
   - [ ] If just uploaded, may show "Parsing in progress..."
   - [ ] Wait 5-10 seconds and refresh
   - [ ] Should show "Successfully parsed" with green checkmark
   - [ ] Skills should be populated

#### 2.4 Test Resume List Page (With Data)
1. Navigate back to http://localhost:3000/careers/resume
2. **List View Test:**
   - [ ] See grid of resume cards
   - [ ] Each card shows:
     - File icon
     - Parsing status
     - File name
     - Upload date
     - File size and type
     - Top 3 skills
     - View Details button
     - Delete button

3. **Stats Test:**
   - [ ] See "Resume Statistics" section at bottom
   - [ ] See "Total Resumes" count
   - [ ] See "Parsed Resumes" count
   - [ ] See "Total Skills Extracted" count

4. **Actions Test:**
   - [ ] Click "View Details" on a resume → Navigate to detail page
   - [ ] Click delete icon → Show confirmation
   - [ ] Confirm delete → Resume removed from list

### Test 3: End-to-End Flow

#### Complete User Journey
1. **Start:** Navigate to http://localhost:3000/careers
2. **Dashboard:** Click "Upload Resume" quick action
3. **Upload:** Drag-drop a PDF resume
4. **Upload:** Click "Upload Resume"
5. **Detail:** Wait for parsing to complete (5-10 seconds)
6. **Detail:** Verify skills, experience, education extracted
7. **List:** Click "Back to Resumes"
8. **List:** Verify resume appears in list
9. **List:** Click "Upload Resume" again
10. **Upload:** Upload another resume
11. **List:** Verify both resumes appear
12. **Stats:** Verify stats are correct

### Test 4: Error Handling

#### 4.1 Invalid File Types
- [ ] Try uploading .txt file → Error toast
- [ ] Try uploading .jpg file → Error toast
- [ ] Try uploading .zip file → Error toast

#### 4.2 File Size Limits
- [ ] Try uploading file > 10MB → Error toast

#### 4.3 Network Errors
- [ ] Stop backend server
- [ ] Try uploading resume → Error toast
- [ ] Try loading resume list → Error toast
- [ ] Start backend server
- [ ] Refresh page → Should work

#### 4.4 Authentication
- [ ] Log out
- [ ] Try accessing `/careers/resume` → Redirect to login
- [ ] Log back in
- [ ] Should work normally

### Test 5: Performance Testing

#### 5.1 Upload Speed
- [ ] Upload 1MB PDF → Should complete in < 5 seconds
- [ ] Upload 5MB PDF → Should complete in < 10 seconds

#### 5.2 Parsing Speed
- [ ] 1-page resume → Parse in < 5 seconds
- [ ] 2-page resume → Parse in < 10 seconds
- [ ] 3-page resume → Parse in < 15 seconds

#### 5.3 List Loading
- [ ] 1 resume → Load instantly
- [ ] 5 resumes → Load in < 1 second
- [ ] 10 resumes → Load in < 2 seconds

### Test 6: Mobile Responsiveness

#### 6.1 Mobile View (375px width)
- [ ] Resume list shows 1 column
- [ ] Upload page is usable
- [ ] Detail page scrolls properly
- [ ] Buttons are tappable
- [ ] Text is readable

#### 6.2 Tablet View (768px width)
- [ ] Resume list shows 2 columns
- [ ] All features work
- [ ] Layout looks good

## 🐛 Common Issues & Solutions

### Issue 1: Backend Not Starting
**Symptoms:** Can't access http://localhost:8000
**Solution:**
```bash
cd careers-backend
docker-compose logs backend
# Check for errors in logs
# Verify .env file exists and has correct values
```

### Issue 2: Resume Parsing Fails
**Symptoms:** Skills not extracted, "Parsing in progress..." forever
**Solution:**
```bash
# Check if GEMINI_API_KEY is set
echo $GEMINI_API_KEY

# Check backend logs
docker-compose logs backend | grep -i error

# Test AI service directly
python test_resume_parsing.py
```

### Issue 3: Upload Fails
**Symptoms:** Error toast on upload
**Solution:**
```bash
# Check if Supabase Storage bucket exists
# Check SUPABASE_SERVICE_ROLE_KEY is correct
# Check backend logs
docker-compose logs backend | tail -50
```

### Issue 4: Resume Not Appearing in List
**Symptoms:** Upload succeeds but resume not in list
**Solution:**
```bash
# Check database
psql $DATABASE_URL -c "SELECT * FROM resumes ORDER BY created_at DESC LIMIT 5;"

# Check API response
curl http://localhost:8000/api/v1/resumes/ \
  -H "Authorization: Bearer <your-token>"
```

### Issue 5: Skills Not Extracted
**Symptoms:** Resume uploaded but no skills shown
**Solution:**
```bash
# Check if AI API key is valid
# Check backend logs for AI errors
docker-compose logs backend | grep -i "gemini\|openai"

# Test AI service
python test_resume_parsing.py
```

## ✅ Success Criteria

All tests should pass:
- ✅ Backend health checks pass
- ✅ Resume parsing test passes
- ✅ Can upload PDF resume
- ✅ Can upload DOCX resume
- ✅ Skills are extracted correctly
- ✅ Experience is extracted correctly
- ✅ Education is extracted correctly
- ✅ Can view resume details
- ✅ Can delete resume
- ✅ Can download resume
- ✅ List view shows all resumes
- ✅ Stats are calculated correctly
- ✅ Mobile view works
- ✅ Error handling works

## 📊 Test Results Template

```
Date: ___________
Tester: ___________

Backend Tests:
[ ] Health check - PASS / FAIL
[ ] Resume parsing - PASS / FAIL

Frontend Tests:
[ ] Resume list page - PASS / FAIL
[ ] Resume upload page - PASS / FAIL
[ ] Resume detail page - PASS / FAIL

End-to-End:
[ ] Complete user journey - PASS / FAIL

Error Handling:
[ ] Invalid file types - PASS / FAIL
[ ] File size limits - PASS / FAIL
[ ] Network errors - PASS / FAIL

Performance:
[ ] Upload speed - PASS / FAIL
[ ] Parsing speed - PASS / FAIL
[ ] List loading - PASS / FAIL

Mobile:
[ ] Mobile view - PASS / FAIL
[ ] Tablet view - PASS / FAIL

Overall: PASS / FAIL

Notes:
_________________________________
_________________________________
_________________________________
```

## 🚀 Next Steps After Testing

Once all tests pass:
1. ✅ Mark Week 1 as complete
2. 📝 Document any issues found
3. 🔧 Fix critical bugs
4. 📸 Take screenshots for documentation
5. 🎯 Move to Week 2: LinkedIn Scraping

---

**Last Updated:** May 15, 2026  
**Status:** Ready for Testing  
**Estimated Testing Time:** 1-2 hours
