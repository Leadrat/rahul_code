import React, { useState, useEffect } from 'react';
import { 
  Brain, TrendingUp, Target, AlertTriangle, Users, 
  BarChart3, Lightbulb, Activity, Award, Zap 
} from 'lucide-react';
import './MLInsights.css';

const MLInsights = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [mlOverview, setMlOverview] = useState(null);
  const [literacyPrediction, setLiteracyPrediction] = useState(null);
  const [internetPrediction, setInternetPrediction] = useState(null);
  const [sanitationClassification, setSanitationClassification] = useState(null);
  const [clustering, setClustering] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [districtRecommendations, setDistrictRecommendations] = useState(null);

  useEffect(() => {
    fetchMLOverview();
  }, []);

  useEffect(() => {
    if (activeTab === 'literacy') fetchLiteracyPrediction();
    else if (activeTab === 'internet') fetchInternetPrediction();
    else if (activeTab === 'sanitation') fetchSanitationClassification();
    else if (activeTab === 'clustering') fetchClustering();
    else if (activeTab === 'anomalies') fetchAnomalies();
    else if (activeTab === 'recommendations') fetchTopRecommendations();
  }, [activeTab]);

  const fetchMLOverview = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/ml/overview');
      const data = await response.json();
      setMlOverview(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ML overview:', error);
      setLoading(false);
    }
  };

  const fetchLiteracyPrediction = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/ml/literacy-prediction');
      const data = await response.json();
      setLiteracyPrediction(data);
    } catch (error) {
      console.error('Error fetching literacy prediction:', error);
    }
  };

  const fetchInternetPrediction = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/ml/internet-prediction');
      const data = await response.json();
      setInternetPrediction(data);
    } catch (error) {
      console.error('Error fetching internet prediction:', error);
    }
  };

  const fetchSanitationClassification = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/ml/sanitation-classification');
      const data = await response.json();
      setSanitationClassification(data);
    } catch (error) {
      console.error('Error fetching sanitation classification:', error);
    }
  };

  const fetchClustering = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/ml/clustering');
      const data = await response.json();
      setClustering(data);
    } catch (error) {
      console.error('Error fetching clustering:', error);
    }
  };

  const fetchAnomalies = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/ml/anomalies');
      const data = await response.json();
      setAnomalies(data);
    } catch (error) {
      console.error('Error fetching anomalies:', error);
    }
  };

  const fetchTopRecommendations = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/ml/top-recommendations');
      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const fetchDistrictRecommendations = async (districtName) => {
    try {
      const response = await fetch(`http://localhost:5000/api/ml/recommendations/${encodeURIComponent(districtName)}`);
      const data = await response.json();
      setDistrictRecommendations(data);
    } catch (error) {
      console.error('Error fetching district recommendations:', error);
    }
  };

  const handleDistrictSearch = (e) => {
    e.preventDefault();
    if (selectedDistrict) {
      fetchDistrictRecommendations(selectedDistrict);
    }
  };

  if (loading) {
    return (
      <div className="ml-insights-loading">
        <Brain size={48} className="loading-icon" />
        <p>Training ML models and loading insights...</p>
      </div>
    );
  }

  return (
    <div className="ml-insights">
      <div className="ml-insights-header">
        <div className="header-content">
          <Brain size={32} />
          <div>
            <h1>ML Insights & Predictions</h1>
            <p>Advanced machine learning analysis of census and housing data</p>
          </div>
        </div>
      </div>

      {/* Model Performance Cards */}
      {mlOverview && (
        <div className="model-cards">
          <div className="model-card">
            <TrendingUp className="card-icon" />
            <h3>Literacy Predictor</h3>
            <div className="metric">
              <span className="metric-label">R² Score</span>
              <span className="metric-value">{(mlOverview.models.literacy_prediction.r2_score * 100).toFixed(1)}%</span>
            </div>
            <div className="metric">
              <span className="metric-label">RMSE</span>
              <span className="metric-value">{mlOverview.models.literacy_prediction.rmse.toFixed(2)}</span>
            </div>
          </div>

          <div className="model-card">
            <Activity className="card-icon" />
            <h3>Internet Predictor</h3>
            <div className="metric">
              <span className="metric-label">R² Score</span>
              <span className="metric-value">{(mlOverview.models.internet_prediction.r2_score * 100).toFixed(1)}%</span>
            </div>
            <div className="metric">
              <span className="metric-label">RMSE</span>
              <span className="metric-value">{mlOverview.models.internet_prediction.rmse.toFixed(2)}</span>
            </div>
          </div>

          <div className="model-card">
            <Target className="card-icon" />
            <h3>Sanitation Classifier</h3>
            <div className="metric">
              <span className="metric-label">Accuracy</span>
              <span className="metric-value">{(mlOverview.models.sanitation_classification.accuracy * 100).toFixed(1)}%</span>
            </div>
          </div>

          <div className="model-card">
            <Users className="card-icon" />
            <h3>District Clustering</h3>
            <div className="metric">
              <span className="metric-label">Clusters</span>
              <span className="metric-value">{mlOverview.models.district_clustering.n_clusters}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Silhouette Score</span>
              <span className="metric-value">{mlOverview.models.district_clustering.silhouette_score.toFixed(3)}</span>
            </div>
          </div>

          <div className="model-card alert">
            <AlertTriangle className="card-icon" />
            <h3>Anomaly Detection</h3>
            <div className="metric">
              <span className="metric-label">Anomalies Found</span>
              <span className="metric-value">{mlOverview.models.anomaly_detection.anomalies_detected}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Percentage</span>
              <span className="metric-value">{mlOverview.models.anomaly_detection.anomaly_percentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="ml-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={18} /> Overview
        </button>
        <button 
          className={activeTab === 'literacy' ? 'active' : ''} 
          onClick={() => setActiveTab('literacy')}
        >
          <TrendingUp size={18} /> Literacy Prediction
        </button>
        <button 
          className={activeTab === 'internet' ? 'active' : ''} 
          onClick={() => setActiveTab('internet')}
        >
          <Activity size={18} /> Internet Prediction
        </button>
        <button 
          className={activeTab === 'sanitation' ? 'active' : ''} 
          onClick={() => setActiveTab('sanitation')}
        >
          <Target size={18} /> Sanitation Risk
        </button>
        <button 
          className={activeTab === 'clustering' ? 'active' : ''} 
          onClick={() => setActiveTab('clustering')}
        >
          <Users size={18} /> District Clusters
        </button>
        <button 
          className={activeTab === 'anomalies' ? 'active' : ''} 
          onClick={() => setActiveTab('anomalies')}
        >
          <AlertTriangle size={18} /> Anomalies
        </button>
        <button 
          className={activeTab === 'recommendations' ? 'active' : ''} 
          onClick={() => setActiveTab('recommendations')}
        >
          <Lightbulb size={18} /> Recommendations
        </button>
      </div>

      {/* Tab Content */}
      <div className="ml-content">
        {activeTab === 'overview' && mlOverview && (
          <div className="overview-content">
            <h2>Machine Learning Models Overview</h2>
            <p className="overview-description">
              We've trained {mlOverview.models_trained} machine learning models to analyze census and housing data, 
              providing predictive insights, classifications, and actionable recommendations for policy makers.
            </p>

            <div className="overview-grid">
              <div className="overview-section">
                <h3><Award size={20} /> Predictive Models</h3>
                <ul>
                  <li><strong>Literacy Rate Prediction:</strong> Forecasts district literacy rates based on infrastructure and socio-economic factors</li>
                  <li><strong>Internet Penetration Prediction:</strong> Predicts future internet adoption rates</li>
                </ul>
              </div>

              <div className="overview-section">
                <h3><Zap size={20} /> Classification & Clustering</h3>
                <ul>
                  <li><strong>Sanitation Risk Classification:</strong> Categorizes districts into Low/Medium/High sanitation risk</li>
                  <li><strong>District Clustering:</strong> Groups similar districts for targeted interventions</li>
                </ul>
              </div>

              <div className="overview-section">
                <h3><AlertTriangle size={20} /> Anomaly Detection</h3>
                <ul>
                  <li><strong>Unusual Patterns:</strong> Identifies districts with unexpected metric combinations</li>
                  <li><strong>Data Quality:</strong> Flags potential data collection issues</li>
                </ul>
              </div>

              <div className="overview-section">
                <h3><Lightbulb size={20} /> Recommendations</h3>
                <ul>
                  <li><strong>Policy Interventions:</strong> AI-generated recommendations for each district</li>
                  <li><strong>Priority Scoring:</strong> Ranks districts by urgency of intervention needs</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'literacy' && literacyPrediction && (
          <div className="model-details">
            <h2>{literacyPrediction.model_name}</h2>
            <div className="model-metrics">
              <div className="metric-box">
                <span className="metric-label">R² Score</span>
                <span className="metric-value large">{(literacyPrediction.r2_score * 100).toFixed(1)}%</span>
                <span className="metric-description">Model explains {(literacyPrediction.r2_score * 100).toFixed(1)}% of variance</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">RMSE</span>
                <span className="metric-value large">{literacyPrediction.rmse.toFixed(2)}</span>
                <span className="metric-description">Average prediction error</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Test Samples</span>
                <span className="metric-value large">{literacyPrediction.test_samples}</span>
                <span className="metric-description">Districts used for testing</span>
              </div>
            </div>

            <h3>Feature Importance</h3>
            <div className="feature-importance">
              {Object.entries(literacyPrediction.feature_importance)
                .sort((a, b) => b[1] - a[1])
                .map(([feature, importance]) => (
                  <div key={feature} className="feature-bar">
                    <span className="feature-name">{feature.replace(/_/g, ' ')}</span>
                    <div className="bar-container">
                      <div 
                        className="bar-fill" 
                        style={{ width: `${importance * 100}%` }}
                      ></div>
                    </div>
                    <span className="feature-value">{(importance * 100).toFixed(1)}%</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'internet' && internetPrediction && (
          <div className="model-details">
            <h2>{internetPrediction.model_name}</h2>
            <div className="model-metrics">
              <div className="metric-box">
                <span className="metric-label">R² Score</span>
                <span className="metric-value large">{(internetPrediction.r2_score * 100).toFixed(1)}%</span>
                <span className="metric-description">Model explains {(internetPrediction.r2_score * 100).toFixed(1)}% of variance</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">RMSE</span>
                <span className="metric-value large">{internetPrediction.rmse.toFixed(2)}</span>
                <span className="metric-description">Average prediction error</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Test Samples</span>
                <span className="metric-value large">{internetPrediction.test_samples}</span>
                <span className="metric-description">Districts used for testing</span>
              </div>
            </div>

            <h3>Feature Importance</h3>
            <div className="feature-importance">
              {Object.entries(internetPrediction.feature_importance)
                .sort((a, b) => b[1] - a[1])
                .map(([feature, importance]) => (
                  <div key={feature} className="feature-bar">
                    <span className="feature-name">{feature.replace(/_/g, ' ')}</span>
                    <div className="bar-container">
                      <div 
                        className="bar-fill" 
                        style={{ width: `${importance * 100}%` }}
                      ></div>
                    </div>
                    <span className="feature-value">{(importance * 100).toFixed(1)}%</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'sanitation' && sanitationClassification && (
          <div className="model-details">
            <h2>{sanitationClassification.model_name}</h2>
            <div className="model-metrics">
              <div className="metric-box">
                <span className="metric-label">Accuracy</span>
                <span className="metric-value large">{(sanitationClassification.accuracy * 100).toFixed(1)}%</span>
                <span className="metric-description">Classification accuracy</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Test Samples</span>
                <span className="metric-value large">{sanitationClassification.test_samples}</span>
                <span className="metric-description">Districts classified</span>
              </div>
            </div>

            <h3>Risk Distribution</h3>
            <div className="class-distribution">
              {Object.entries(sanitationClassification.class_distribution).map(([risk, count]) => (
                <div key={risk} className={`risk-card risk-${risk.toLowerCase()}`}>
                  <h4>{risk} Risk</h4>
                  <p className="risk-count">{count} districts</p>
                </div>
              ))}
            </div>

            <h3>Feature Importance</h3>
            <div className="feature-importance">
              {Object.entries(sanitationClassification.feature_importance)
                .sort((a, b) => b[1] - a[1])
                .map(([feature, importance]) => (
                  <div key={feature} className="feature-bar">
                    <span className="feature-name">{feature.replace(/_/g, ' ')}</span>
                    <div className="bar-container">
                      <div 
                        className="bar-fill" 
                        style={{ width: `${importance * 100}%` }}
                      ></div>
                    </div>
                    <span className="feature-value">{(importance * 100).toFixed(1)}%</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'clustering' && clustering && (
          <div className="clustering-content">
            <h2>{clustering.model_name}</h2>
            <p className="clustering-description">
              Districts grouped into {clustering.n_clusters} clusters based on socio-economic similarity. 
              Silhouette score: {clustering.silhouette_score.toFixed(3)} (higher is better).
            </p>

            <div className="clusters-grid">
              {clustering.cluster_profiles.map((cluster) => (
                <div key={cluster.cluster_id} className="cluster-card">
                  <h3>Cluster {cluster.cluster_id + 1}</h3>
                  <p className="cluster-size">{cluster.size} districts</p>
                  
                  <div className="cluster-metrics">
                    <div className="cluster-metric">
                      <span>Avg Literacy</span>
                      <strong>{cluster.avg_literacy.toFixed(1)}%</strong>
                    </div>
                    <div className="cluster-metric">
                      <span>Avg Urbanisation</span>
                      <strong>{cluster.avg_urbanisation.toFixed(1)}%</strong>
                    </div>
                    <div className="cluster-metric">
                      <span>Avg Internet</span>
                      <strong>{cluster.avg_internet.toFixed(1)}%</strong>
                    </div>
                    <div className="cluster-metric">
                      <span>Sanitation Gap</span>
                      <strong>{cluster.avg_sanitation_gap.toFixed(1)}%</strong>
                    </div>
                  </div>

                  <div className="cluster-examples">
                    <h4>Example Districts:</h4>
                    <ul>
                      {cluster.districts.map((district, idx) => (
                        <li key={idx}>{district}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'anomalies' && anomalies && (
          <div className="anomalies-content">
            <h2>{anomalies.model_name}</h2>
            <p className="anomalies-description">
              Detected {anomalies.anomalies_detected} anomalous districts ({anomalies.anomaly_percentage.toFixed(1)}% of total) 
              with unusual patterns that warrant further investigation.
            </p>

            <div className="anomalies-list">
              {anomalies.anomalies.map((anomaly, idx) => (
                <div key={idx} className="anomaly-card">
                  <h3>{anomaly.district}, {anomaly.state}</h3>
                  <div className="anomaly-metrics">
                    <div className="anomaly-metric">
                      <span>Literacy Rate</span>
                      <strong>{anomaly.literacy_rate.toFixed(1)}%</strong>
                    </div>
                    <div className="anomaly-metric">
                      <span>Urbanisation</span>
                      <strong>{anomaly.urbanisation_rate.toFixed(1)}%</strong>
                    </div>
                    <div className="anomaly-metric">
                      <span>Internet</span>
                      <strong>{anomaly.internet_penetration.toFixed(1)}%</strong>
                    </div>
                    <div className="anomaly-metric">
                      <span>Sanitation Gap</span>
                      <strong>{anomaly.sanitation_gap.toFixed(1)}%</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="recommendations-content">
            <h2>Policy Recommendations</h2>
            
            <div className="district-search">
              <form onSubmit={handleDistrictSearch}>
                <input
                  type="text"
                  placeholder="Enter district name..."
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                />
                <button type="submit">Get Recommendations</button>
              </form>
            </div>

            {districtRecommendations && !districtRecommendations.error && (
              <div className="district-recommendations">
                <h3>{districtRecommendations.district}, {districtRecommendations.state}</h3>
                <div className="priority-badge">
                  Priority Score: {districtRecommendations.priority_score}
                </div>

                <div className="current-metrics">
                  <h4>Current Metrics</h4>
                  <div className="metrics-grid">
                    {Object.entries(districtRecommendations.current_metrics).map(([key, value]) => (
                      <div key={key} className="metric-item">
                        <span>{key.replace(/_/g, ' ')}</span>
                        <strong>{value.toFixed(1)}%</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="recommendations-list">
                  <h4>Recommended Interventions ({districtRecommendations.total_recommendations})</h4>
                  {districtRecommendations.recommendations.map((rec, idx) => (
                    <div key={idx} className={`recommendation-card priority-${rec.priority.toLowerCase()}`}>
                      <div className="rec-header">
                        <span className="rec-category">{rec.category}</span>
                        <span className="rec-priority">{rec.priority} Priority</span>
                      </div>
                      <h5>{rec.intervention}</h5>
                      <p className="rec-reason"><strong>Reason:</strong> {rec.reason}</p>
                      <p className="rec-impact"><strong>Expected Impact:</strong> {rec.expected_impact}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recommendations && (
              <div className="top-recommendations">
                <h3>Top Priority Districts</h3>
                <p>Districts ranked by urgency of intervention needs (analyzed {recommendations.total_analyzed} districts)</p>
                
                <div className="priority-list">
                  {recommendations.top_priority_districts.slice(0, 10).map((district, idx) => (
                    <div key={idx} className="priority-item">
                      <div className="priority-rank">{idx + 1}</div>
                      <div className="priority-info">
                        <h4>{district.district}, {district.state}</h4>
                        <p>{district.total_recommendations} interventions recommended</p>
                      </div>
                      <div className="priority-score-badge">
                        Score: {district.priority_score}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MLInsights;
