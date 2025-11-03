"""Machine Learning models for India Census & Housing Data Analysis.

This module provides ML functionalities including:
- Predictive models (Literacy, Internet Penetration, Housing Condition)
- Clustering (District Segmentation, Housing Types)
- Classification (Sanitation Risk, Asset Ownership)
- Anomaly Detection
- Recommendation Systems
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier, IsolationForest
from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, classification_report, silhouette_score
from sklearn.decomposition import PCA
import joblib
from pathlib import Path
from typing import Dict, List, Tuple, Any
import warnings
warnings.filterwarnings('ignore')


class MLModelManager:
    """Central manager for all ML models and predictions."""
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.feature_names = {}
        
    def prepare_features(self, df: pd.DataFrame, feature_cols: List[str]) -> Tuple[np.ndarray, StandardScaler]:
        """Prepare and scale features for ML models."""
        # Handle missing values
        df_clean = df[feature_cols].fillna(df[feature_cols].median())
        
        # Scale features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(df_clean)
        
        return X_scaled, scaler
    
    def train_literacy_predictor(self, district_df: pd.DataFrame) -> Dict[str, Any]:
        """Train model to predict literacy rates."""
        feature_cols = [
            'Population', 'Urbanisation_Rate', 'Internet_Penetration',
            'Mobile_Phone_Access', 'Worker_Participation_Rate',
            'Households_with_Television', 'Households_with_Computer'
        ]
        
        # Prepare data
        df_clean = district_df.dropna(subset=['Literacy_Rate'] + feature_cols)
        X, scaler = self.prepare_features(df_clean, feature_cols)
        y = df_clean['Literacy_Rate'].values
        
        # Train-test split
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train model
        model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10)
        model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        # Store model
        self.models['literacy_predictor'] = model
        self.scalers['literacy_predictor'] = scaler
        self.feature_names['literacy_predictor'] = feature_cols
        
        # Feature importance
        feature_importance = dict(zip(feature_cols, model.feature_importances_))
        
        return {
            'model_name': 'Literacy Rate Predictor',
            'mse': float(mse),
            'r2_score': float(r2),
            'rmse': float(np.sqrt(mse)),
            'feature_importance': feature_importance,
            'test_samples': len(y_test)
        }
    
    def train_internet_predictor(self, district_df: pd.DataFrame) -> Dict[str, Any]:
        """Train model to predict internet penetration."""
        feature_cols = [
            'Literacy_Rate', 'Urbanisation_Rate', 'Mobile_Phone_Access',
            'Households_with_Television', 'Households_with_Computer',
            'Worker_Participation_Rate', 'Population'
        ]
        
        df_clean = district_df.dropna(subset=['Internet_Penetration'] + feature_cols)
        X, scaler = self.prepare_features(df_clean, feature_cols)
        y = df_clean['Internet_Penetration'].values
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10)
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        self.models['internet_predictor'] = model
        self.scalers['internet_predictor'] = scaler
        self.feature_names['internet_predictor'] = feature_cols
        
        feature_importance = dict(zip(feature_cols, model.feature_importances_))
        
        return {
            'model_name': 'Internet Penetration Predictor',
            'mse': float(mse),
            'r2_score': float(r2),
            'rmse': float(np.sqrt(mse)),
            'feature_importance': feature_importance,
            'test_samples': len(y_test)
        }
    
    def train_sanitation_classifier(self, district_df: pd.DataFrame) -> Dict[str, Any]:
        """Train model to classify sanitation risk levels."""
        feature_cols = [
            'Literacy_Rate', 'Urbanisation_Rate', 'Population',
            'Worker_Participation_Rate', 'Internet_Penetration'
        ]
        
        # Create risk categories based on sanitation gap
        df_clean = district_df.dropna(subset=['Sanitation_Gap'] + feature_cols).copy()
        
        # Define risk levels: Low (0-20%), Medium (20-50%), High (>50%)
        df_clean['Sanitation_Risk'] = pd.cut(
            df_clean['Sanitation_Gap'],
            bins=[0, 20, 50, 100],
            labels=['Low', 'Medium', 'High']
        )
        
        X, scaler = self.prepare_features(df_clean, feature_cols)
        y = df_clean['Sanitation_Risk'].values
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10)
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        accuracy = (y_pred == y_test).mean()
        
        self.models['sanitation_classifier'] = model
        self.scalers['sanitation_classifier'] = scaler
        self.feature_names['sanitation_classifier'] = feature_cols
        
        feature_importance = dict(zip(feature_cols, model.feature_importances_))
        
        # Get class distribution
        unique, counts = np.unique(y_test, return_counts=True)
        class_distribution = dict(zip(unique, counts.tolist()))
        
        return {
            'model_name': 'Sanitation Risk Classifier',
            'accuracy': float(accuracy),
            'feature_importance': feature_importance,
            'test_samples': len(y_test),
            'class_distribution': class_distribution
        }
    
    def perform_district_clustering(self, district_df: pd.DataFrame, n_clusters: int = 5) -> Dict[str, Any]:
        """Cluster districts based on socio-economic indicators."""
        feature_cols = [
            'Literacy_Rate', 'Worker_Participation_Rate', 'Urbanisation_Rate',
            'Internet_Penetration', 'Mobile_Phone_Access', 'Sanitation_Gap',
            'Sex_Ratio'
        ]
        
        df_clean = district_df.dropna(subset=feature_cols).copy()
        X, scaler = self.prepare_features(df_clean, feature_cols)
        
        # K-Means clustering
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(X)
        
        # Calculate silhouette score
        silhouette = silhouette_score(X, clusters)
        
        # Store results
        df_clean['Cluster'] = clusters
        self.models['district_clustering'] = kmeans
        self.scalers['district_clustering'] = scaler
        self.feature_names['district_clustering'] = feature_cols
        
        # Analyze clusters
        cluster_profiles = []
        for i in range(n_clusters):
            cluster_data = df_clean[df_clean['Cluster'] == i]
            profile = {
                'cluster_id': int(i),
                'size': int(len(cluster_data)),
                'avg_literacy': float(cluster_data['Literacy_Rate'].mean()),
                'avg_urbanisation': float(cluster_data['Urbanisation_Rate'].mean()),
                'avg_internet': float(cluster_data['Internet_Penetration'].mean()),
                'avg_sanitation_gap': float(cluster_data['Sanitation_Gap'].mean()),
                'districts': cluster_data['District name'].tolist()[:5]  # Top 5 examples
            }
            cluster_profiles.append(profile)
        
        return {
            'model_name': 'District Clustering',
            'n_clusters': n_clusters,
            'silhouette_score': float(silhouette),
            'cluster_profiles': cluster_profiles,
            'total_districts': len(df_clean)
        }
    
    def detect_anomalies(self, district_df: pd.DataFrame) -> Dict[str, Any]:
        """Detect anomalous districts using Isolation Forest."""
        feature_cols = [
            'Literacy_Rate', 'Worker_Participation_Rate', 'Urbanisation_Rate',
            'Internet_Penetration', 'Sanitation_Gap', 'Sex_Ratio'
        ]
        
        df_clean = district_df.dropna(subset=feature_cols + ['District name', 'State name']).copy()
        X, scaler = self.prepare_features(df_clean, feature_cols)
        
        # Train Isolation Forest
        iso_forest = IsolationForest(contamination=0.05, random_state=42)
        predictions = iso_forest.fit_predict(X)
        
        # -1 for anomalies, 1 for normal
        df_clean['Anomaly'] = predictions
        anomalies = df_clean[df_clean['Anomaly'] == -1]
        
        self.models['anomaly_detector'] = iso_forest
        self.scalers['anomaly_detector'] = scaler
        self.feature_names['anomaly_detector'] = feature_cols
        
        # Get anomaly details
        anomaly_list = []
        for _, row in anomalies.iterrows():
            anomaly_list.append({
                'district': row['District name'],
                'state': row['State name'],
                'literacy_rate': float(row['Literacy_Rate']),
                'urbanisation_rate': float(row['Urbanisation_Rate']),
                'internet_penetration': float(row['Internet_Penetration']),
                'sanitation_gap': float(row['Sanitation_Gap'])
            })
        
        return {
            'model_name': 'Anomaly Detection',
            'total_districts': len(df_clean),
            'anomalies_detected': len(anomalies),
            'anomaly_percentage': float(len(anomalies) / len(df_clean) * 100),
            'anomalies': anomaly_list[:20]  # Top 20 anomalies
        }
    
    def generate_policy_recommendations(self, district_df: pd.DataFrame, district_name: str) -> Dict[str, Any]:
        """Generate policy recommendations for a specific district."""
        district_data = district_df[district_df['District name'] == district_name]
        
        if district_data.empty:
            return {'error': 'District not found'}
        
        district = district_data.iloc[0]
        recommendations = []
        priority_score = 0
        
        # Literacy intervention
        if district['Literacy_Rate'] < 70:
            recommendations.append({
                'category': 'Education',
                'priority': 'High',
                'intervention': 'Adult Literacy Programs',
                'reason': f"Literacy rate is {district['Literacy_Rate']:.1f}%, below national average",
                'expected_impact': 'Improve workforce quality and economic opportunities'
            })
            priority_score += 3
        
        # Internet connectivity
        if district['Internet_Penetration'] < 15:
            recommendations.append({
                'category': 'Digital Infrastructure',
                'priority': 'High',
                'intervention': 'Broadband Expansion Program',
                'reason': f"Internet penetration is only {district['Internet_Penetration']:.1f}%",
                'expected_impact': 'Enable digital education, e-governance, and economic growth'
            })
            priority_score += 3
        
        # Sanitation
        if district['Sanitation_Gap'] > 30:
            recommendations.append({
                'category': 'Sanitation',
                'priority': 'Critical',
                'intervention': 'Swachh Bharat Mission - Toilet Construction',
                'reason': f"Sanitation gap is {district['Sanitation_Gap']:.1f}%, indicating poor latrine coverage",
                'expected_impact': 'Improve public health, reduce disease burden, enhance dignity'
            })
            priority_score += 4
        
        # Urbanization and infrastructure
        if district['Urbanisation_Rate'] < 20 and district['Mobile_Phone_Access'] < 50:
            recommendations.append({
                'category': 'Infrastructure',
                'priority': 'Medium',
                'intervention': 'Rural Connectivity and Electrification',
                'reason': f"Low urbanization ({district['Urbanisation_Rate']:.1f}%) with poor mobile access",
                'expected_impact': 'Bridge urban-rural divide, improve communication'
            })
            priority_score += 2
        
        # Worker participation
        if district['Worker_Participation_Rate'] < 35:
            recommendations.append({
                'category': 'Employment',
                'priority': 'Medium',
                'intervention': 'Skill Development and Job Creation Programs',
                'reason': f"Worker participation is {district['Worker_Participation_Rate']:.1f}%, below optimal levels",
                'expected_impact': 'Increase household income and economic productivity'
            })
            priority_score += 2
        
        return {
            'district': district_name,
            'state': district['State name'],
            'priority_score': priority_score,
            'total_recommendations': len(recommendations),
            'recommendations': recommendations,
            'current_metrics': {
                'literacy_rate': float(district['Literacy_Rate']),
                'internet_penetration': float(district['Internet_Penetration']),
                'sanitation_gap': float(district['Sanitation_Gap']),
                'urbanisation_rate': float(district['Urbanisation_Rate']),
                'worker_participation': float(district['Worker_Participation_Rate'])
            }
        }
    
    def perform_pca_analysis(self, district_df: pd.DataFrame) -> Dict[str, Any]:
        """Perform PCA for dimensionality reduction and visualization."""
        feature_cols = [
            'Literacy_Rate', 'Worker_Participation_Rate', 'Urbanisation_Rate',
            'Internet_Penetration', 'Mobile_Phone_Access', 'Sanitation_Gap',
            'Sex_Ratio'
        ]
        
        df_clean = district_df.dropna(subset=feature_cols).copy()
        X, scaler = self.prepare_features(df_clean, feature_cols)
        
        # Perform PCA
        pca = PCA(n_components=3)
        X_pca = pca.fit_transform(X)
        
        # Store results
        self.models['pca'] = pca
        self.scalers['pca'] = scaler
        self.feature_names['pca'] = feature_cols
        
        # Get explained variance
        explained_variance = pca.explained_variance_ratio_
        
        # Prepare data for visualization
        pca_data = []
        for i, (pc1, pc2, pc3) in enumerate(X_pca[:100]):  # Limit to 100 for visualization
            pca_data.append({
                'pc1': float(pc1),
                'pc2': float(pc2),
                'pc3': float(pc3),
                'district': df_clean.iloc[i]['District name'],
                'state': df_clean.iloc[i]['State name']
            })
        
        return {
            'model_name': 'PCA Analysis',
            'explained_variance': {
                'PC1': float(explained_variance[0]),
                'PC2': float(explained_variance[1]),
                'PC3': float(explained_variance[2]),
                'total': float(explained_variance.sum())
            },
            'pca_data': pca_data,
            'feature_loadings': {
                feature: [float(pca.components_[i][j]) for i in range(3)]
                for j, feature in enumerate(feature_cols)
            }
        }
    
    def predict_literacy(self, features: Dict[str, float]) -> float:
        """Predict literacy rate for given features."""
        if 'literacy_predictor' not in self.models:
            raise ValueError("Literacy predictor model not trained")
        
        feature_cols = self.feature_names['literacy_predictor']
        X = np.array([[features[col] for col in feature_cols]])
        X_scaled = self.scalers['literacy_predictor'].transform(X)
        
        prediction = self.models['literacy_predictor'].predict(X_scaled)
        return float(prediction[0])
    
    def get_district_cluster(self, features: Dict[str, float]) -> int:
        """Get cluster assignment for given district features."""
        if 'district_clustering' not in self.models:
            raise ValueError("Clustering model not trained")
        
        feature_cols = self.feature_names['district_clustering']
        X = np.array([[features[col] for col in feature_cols]])
        X_scaled = self.scalers['district_clustering'].transform(X)
        
        cluster = self.models['district_clustering'].predict(X_scaled)
        return int(cluster[0])
    
    def save_models(self, output_dir: Path):
        """Save all trained models to disk."""
        output_dir.mkdir(parents=True, exist_ok=True)
        
        for model_name, model in self.models.items():
            model_path = output_dir / f"{model_name}.joblib"
            joblib.dump(model, model_path)
            
        for scaler_name, scaler in self.scalers.items():
            scaler_path = output_dir / f"{scaler_name}_scaler.joblib"
            joblib.dump(scaler, scaler_path)
    
    def load_models(self, input_dir: Path):
        """Load trained models from disk."""
        for model_file in input_dir.glob("*.joblib"):
            if "scaler" not in model_file.name:
                model_name = model_file.stem
                self.models[model_name] = joblib.load(model_file)
            else:
                scaler_name = model_file.stem.replace("_scaler", "")
                self.scalers[scaler_name] = joblib.load(model_file)


def train_all_models(district_df: pd.DataFrame) -> Dict[str, Any]:
    """Train all ML models and return results."""
    ml_manager = MLModelManager()
    
    results = {
        'literacy_prediction': ml_manager.train_literacy_predictor(district_df),
        'internet_prediction': ml_manager.train_internet_predictor(district_df),
        'sanitation_classification': ml_manager.train_sanitation_classifier(district_df),
        'district_clustering': ml_manager.perform_district_clustering(district_df, n_clusters=5),
        'anomaly_detection': ml_manager.detect_anomalies(district_df),
        'pca_analysis': ml_manager.perform_pca_analysis(district_df)
    }
    
    return results, ml_manager
