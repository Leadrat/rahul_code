# ML Features Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install frontend dependencies (if not already done)
cd frontend
npm install
cd ..
```

### Step 2: Start the Backend

```bash
# From the census_india_data_analysis directory
python backend/app.py
```

**Expected Output:**
```
✓ Data loaded successfully
⏳ Training ML models...
✓ ML models trained successfully
 * Running on http://127.0.0.1:5000
```

⏱️ **Note**: Model training takes 30-60 seconds on first startup.

### Step 3: Start the Frontend

```bash
# In a new terminal
cd frontend
npm start
```

The app will open at `http://localhost:3000`

### Step 4: Explore ML Insights

1. Click on **"ML Insights"** in the sidebar (Brain icon 🧠)
2. View model performance cards at the top
3. Explore different tabs:
   - **Overview**: Introduction to all ML features
   - **Literacy Prediction**: See which factors predict literacy
   - **Sanitation Risk**: View districts by risk level
   - **District Clusters**: Explore district groupings
   - **Recommendations**: Get AI-powered policy suggestions

## 🎯 Quick Examples

### Example 1: Get Recommendations for a District

1. Go to **ML Insights** → **Recommendations** tab
2. Type a district name (e.g., "Kupwara")
3. Click "Get Recommendations"
4. View prioritized interventions with expected impact

### Example 2: Identify High-Risk Sanitation Districts

1. Go to **ML Insights** → **Sanitation Risk** tab
2. View the risk distribution (Low/Medium/High)
3. See which factors contribute most to sanitation risk
4. Use this to prioritize Swachh Bharat initiatives

### Example 3: Find Similar Districts

1. Go to **ML Insights** → **District Clusters** tab
2. Browse the 5 cluster groups
3. See average metrics for each cluster
4. Identify example districts in each group
5. Design cluster-specific programs

### Example 4: Discover Anomalous Districts

1. Go to **ML Insights** → **Anomalies** tab
2. View districts with unusual patterns
3. Investigate why they're different
4. Learn from success stories or identify data issues

## 📊 Understanding the Metrics

### R² Score (Prediction Models)
- **Range**: 0 to 1 (higher is better)
- **Interpretation**: 
  - 0.75 = Model explains 75% of variance
  - Good models: > 0.70
  - Excellent models: > 0.85

### RMSE (Root Mean Square Error)
- **Lower is better**
- Average prediction error in same units as target
- Example: RMSE of 5.2 for literacy means ±5.2% average error

### Accuracy (Classification)
- **Range**: 0 to 1 (higher is better)
- Percentage of correct predictions
- Good classifiers: > 0.80

### Silhouette Score (Clustering)
- **Range**: -1 to 1 (higher is better)
- Measures cluster quality
- Good clustering: > 0.30

## 🔍 API Testing

Test the ML endpoints directly:

```bash
# Get ML overview
curl http://localhost:5000/api/ml/overview

# Get literacy prediction details
curl http://localhost:5000/api/ml/literacy-prediction

# Get recommendations for a district
curl http://localhost:5000/api/ml/recommendations/Kupwara

# Get top priority districts
curl http://localhost:5000/api/ml/top-recommendations
```

## 🎨 UI Features

### Model Performance Cards
- Quick overview of each model
- Color-coded by model type
- Click on tabs to see details

### Feature Importance Charts
- Horizontal bars showing factor importance
- Longer bars = more important features
- Helps understand what drives outcomes

### Interactive Recommendations
- Search any district by name
- Priority-coded interventions (Critical/High/Medium)
- Specific reasons and expected impacts

### Cluster Visualization
- Grid layout of district groups
- Average metrics per cluster
- Example districts for each group

## 💡 Tips & Tricks

### For Policy Makers
1. Start with **Top Recommendations** to see urgent priorities
2. Use **Clustering** to design region-specific programs
3. Check **Anomalies** to find best practices

### For Researchers
1. Examine **Feature Importance** to understand drivers
2. Use **PCA Analysis** for dimensionality reduction
3. Study **Anomalies** for unique cases

### For Data Scientists
1. Check model performance metrics in **Overview**
2. Analyze feature importance across models
3. Use API endpoints for custom analysis

## 🐛 Troubleshooting

### "ML models not trained yet" Error
- **Cause**: Backend still training models
- **Solution**: Wait 30-60 seconds, then refresh

### Models Training Slowly
- **Cause**: Large dataset or slow CPU
- **Solution**: Normal on first run, subsequent runs use cached data

### District Not Found
- **Cause**: Typo in district name
- **Solution**: Check spelling, use exact name from dataset

### Frontend Not Connecting
- **Cause**: Backend not running
- **Solution**: Ensure `python backend/app.py` is running on port 5000

## 📈 Next Steps

1. **Explore All Tabs**: Each tab shows different ML insights
2. **Test Recommendations**: Search for your district of interest
3. **Compare Clusters**: See how districts group together
4. **Read Full Docs**: Check `ML_FEATURES.md` for detailed info
5. **Customize Models**: Modify `src/ml_models.py` for your needs

## 🎓 Learning Resources

### Understanding the Models
- **Random Forest**: Ensemble of decision trees, robust and interpretable
- **K-Means Clustering**: Groups similar data points together
- **Isolation Forest**: Detects outliers by isolating anomalies
- **PCA**: Reduces dimensions while preserving variance

### Key Concepts
- **Feature Engineering**: Creating useful input variables
- **Train-Test Split**: Evaluating on unseen data
- **Cross-Validation**: Robust performance estimation
- **Feature Importance**: Understanding model decisions

## 🚀 Advanced Usage

### Save Trained Models
```python
from pathlib import Path
ml_manager.save_models(Path('models'))
```

### Load Pre-trained Models
```python
ml_manager.load_models(Path('models'))
```

### Custom Predictions
```python
features = {
    'Population': 500000,
    'Urbanisation_Rate': 45.0,
    'Internet_Penetration': 25.0,
    # ... other features
}
prediction = ml_manager.predict_literacy(features)
```

## 📞 Support

- **Documentation**: See `ML_FEATURES.md`
- **Issues**: Open GitHub issue
- **Questions**: Check troubleshooting section

---

**Happy Analyzing! 🎉**

The ML features provide powerful insights for data-driven decision making in census and housing analysis.
