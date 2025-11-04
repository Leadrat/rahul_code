# ML Features Setup Checklist

## ✅ Pre-Flight Checklist

Before running the ML features, verify the following:

### 1. Python Environment
- [ ] Python 3.8+ installed
- [ ] pip is up to date
- [ ] Virtual environment activated (optional but recommended)

### 2. Node.js Environment
- [ ] Node.js 14+ installed
- [ ] npm is available

### 3. Dependencies Installed

#### Backend Dependencies
```bash
pip install -r requirements.txt
```

Required packages:
- [ ] pandas
- [ ] numpy
- [ ] matplotlib
- [ ] seaborn
- [ ] flask
- [ ] flask-cors
- [ ] spacy
- [ ] scikit-learn
- [ ] plotly
- [ ] joblib

#### Frontend Dependencies
```bash
cd frontend
npm install
```

### 4. Data Files Present
- [ ] `india-districts-census-2011.csv` exists
- [ ] `india_census_housing-hlpca-full.csv` exists
- [ ] `hlpca-colnames.csv` exists

### 5. File Structure
```
census_india_data_analysis/
├── backend/
│   └── app.py (modified with ML endpoints)
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── MLInsights.js (NEW)
│       │   └── MLInsights.css (NEW)
│       ├── App.js (modified)
│       └── components/
│           └── Layout.js (modified)
├── src/
│   ├── data_analysis.py
│   └── ml_models.py (NEW)
├── requirements.txt (updated)
└── [CSV files]
```

---

## 🚀 Launch Sequence

### Option 1: Automated Launch (Recommended)
```bash
# Double-click or run:
RUN_ML_APP.bat
```

### Option 2: Manual Launch

#### Step 1: Start Backend
```bash
# Terminal 1
python backend/app.py
```

**Wait for these messages:**
```
✓ Data loaded successfully
⏳ Training ML models...
✓ ML models trained successfully
 * Running on http://127.0.0.1:5000
```

⏱️ **Expected time**: 30-60 seconds

#### Step 2: Start Frontend
```bash
# Terminal 2
cd frontend
npm start
```

**Wait for:**
```
Compiled successfully!
Local: http://localhost:3000
```

⏱️ **Expected time**: 10-20 seconds

---

## 🧪 Verification Tests

### Test 1: Backend Health Check
```bash
curl http://localhost:5000/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-03T..."
}
```

### Test 2: ML Overview Endpoint
```bash
curl http://localhost:5000/api/ml/overview
```

**Expected response:**
```json
{
  "models_trained": 6,
  "models": {
    "literacy_prediction": {...},
    "internet_prediction": {...},
    ...
  }
}
```

### Test 3: Frontend Access
Open browser: `http://localhost:3000`

**Expected:**
- [ ] Application loads
- [ ] Sidebar shows "ML Insights" option
- [ ] No console errors

### Test 4: ML Insights Page
Navigate to: `http://localhost:3000/ml-insights`

**Expected:**
- [ ] Page loads without errors
- [ ] 5 model performance cards visible
- [ ] 7 tabs are clickable
- [ ] Overview tab shows content

### Test 5: Tab Navigation
Click through all tabs:
- [ ] Overview
- [ ] Literacy Prediction
- [ ] Internet Prediction
- [ ] Sanitation Risk
- [ ] District Clusters
- [ ] Anomalies
- [ ] Recommendations

### Test 6: District Recommendations
1. Go to Recommendations tab
2. Type "Kupwara" in search box
3. Click "Get Recommendations"

**Expected:**
- [ ] Recommendations load
- [ ] Priority score displayed
- [ ] Current metrics shown
- [ ] Intervention cards visible

---

## 🐛 Troubleshooting

### Issue: Backend won't start

**Error:** `ModuleNotFoundError: No module named 'sklearn'`

**Solution:**
```bash
pip install scikit-learn
```

---

**Error:** `FileNotFoundError: [Errno 2] No such file or directory: 'india-districts-census-2011.csv'`

**Solution:**
- Verify CSV files are in the root directory
- Check file names match exactly

---

### Issue: ML models not training

**Error:** Console shows errors during model training

**Solution:**
1. Check data files are not corrupted
2. Verify all dependencies installed
3. Check for sufficient memory (need ~1GB free)

---

### Issue: Frontend won't connect to backend

**Error:** Network error in browser console

**Solution:**
1. Verify backend is running on port 5000
2. Check CORS is enabled in Flask
3. Ensure no firewall blocking localhost

---

### Issue: "ML models not trained yet" in UI

**Cause:** Models still training or failed to train

**Solution:**
1. Wait 30-60 seconds after backend starts
2. Check backend console for error messages
3. Refresh the page

---

### Issue: District search returns "District not found"

**Cause:** Typo in district name

**Solution:**
- Use exact district names from dataset
- Check spelling carefully
- Try: "Kupwara", "Mumbai", "Delhi", etc.

---

## 📊 Performance Expectations

### Backend Startup
- **Data Loading**: 5-10 seconds
- **Model Training**: 30-60 seconds
- **Total Startup**: 35-70 seconds

### API Response Times
- `/api/ml/overview`: < 100ms
- `/api/ml/literacy-prediction`: < 200ms
- `/api/ml/recommendations/<district>`: < 500ms
- `/api/ml/top-recommendations`: 2-3 seconds

### Frontend Performance
- **Initial Load**: 2-3 seconds
- **Tab Switching**: Instant (< 100ms)
- **API Calls**: As per backend times above

### Memory Usage
- **Backend**: ~500-800 MB
- **Frontend**: ~200-300 MB
- **Total**: ~1 GB recommended

---

## 🎯 Success Criteria

Your ML implementation is working correctly if:

✅ Backend starts without errors
✅ All 6 models train successfully
✅ All 11 API endpoints respond
✅ Frontend loads ML Insights page
✅ All 7 tabs display content
✅ Model performance cards show metrics
✅ Feature importance charts render
✅ District search returns recommendations
✅ No console errors in browser
✅ Responsive design works on mobile

---

## 📈 Next Steps After Setup

### For First-Time Users
1. ✅ Read `ML_QUICKSTART.md` for 5-minute intro
2. ✅ Explore Overview tab to understand features
3. ✅ Try searching for a district in Recommendations
4. ✅ Browse through all tabs to see different insights

### For Developers
1. ✅ Read `ML_FEATURES.md` for technical details
2. ✅ Review `src/ml_models.py` for model implementations
3. ✅ Check API endpoints in `backend/app.py`
4. ✅ Explore frontend code in `MLInsights.js`

### For Policy Makers
1. ✅ Go directly to Recommendations tab
2. ✅ Search for districts of interest
3. ✅ View Top Priority Districts
4. ✅ Export findings (future feature)

### For Researchers
1. ✅ Examine Feature Importance in model tabs
2. ✅ Study Anomalies for unique cases
3. ✅ Analyze Cluster Profiles
4. ✅ Use API for custom analysis

---

## 🔧 Advanced Configuration

### Change Number of Clusters
Edit `src/ml_models.py`:
```python
# Line ~200
def perform_district_clustering(self, district_df: pd.DataFrame, n_clusters: int = 5):
    # Change n_clusters parameter
```

### Adjust Anomaly Detection Sensitivity
Edit `src/ml_models.py`:
```python
# Line ~250
iso_forest = IsolationForest(contamination=0.05, random_state=42)
# Change contamination (0.01 to 0.1)
```

### Modify Model Parameters
Edit `src/ml_models.py`:
```python
# Line ~60
model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10)
# Adjust n_estimators, max_depth, etc.
```

### Save Trained Models
Add to backend startup:
```python
from pathlib import Path
ml_manager.save_models(Path('models'))
```

### Load Pre-trained Models
Replace training with:
```python
ml_manager.load_models(Path('models'))
```

---

## 📞 Support Resources

### Documentation
- `ML_QUICKSTART.md` - Quick start guide
- `ML_FEATURES.md` - Feature documentation
- `ML_UI_GUIDE.md` - UI walkthrough
- `ML_IMPLEMENTATION_SUMMARY.md` - Technical details
- `README_ML.md` - Overview

### Code Files
- `src/ml_models.py` - ML implementations
- `backend/app.py` - API endpoints
- `frontend/src/pages/MLInsights.js` - UI component

### Online Resources
- scikit-learn docs: https://scikit-learn.org
- Flask docs: https://flask.palletsprojects.com
- React docs: https://react.dev

---

## ✅ Final Checklist

Before considering setup complete:

- [ ] Backend starts successfully
- [ ] All 6 models train without errors
- [ ] Frontend loads without issues
- [ ] ML Insights page accessible
- [ ] All tabs display correctly
- [ ] API endpoints respond
- [ ] District search works
- [ ] No console errors
- [ ] Documentation reviewed
- [ ] Ready to use!

---

## 🎉 You're All Set!

If all checks pass, your ML implementation is ready to use.

**Access the application:**
- Frontend: http://localhost:3000
- ML Insights: http://localhost:3000/ml-insights
- API: http://localhost:5000/api/ml/overview

**Happy Analyzing! 🚀**
