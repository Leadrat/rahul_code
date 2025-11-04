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
        """Train model to predict literacy rates with housing features."""
        # Enhanced feature set including housing data
        feature_cols = [
            'Population', 'Urbanisation_Rate', 'Internet_Penetration',
            'Mobile_Phone_Access', 'Worker_Participation_Rate',
            'Households_with_Television', 'Households_with_Computer',
            # Housing features (if available)
            'Housing_Quality_Score', 'Modern_Construction_Score', 'Clean_Energy_Score',
            'Digital_Assets_Score', 'Infrastructure_Score', 'MSL_Electricty',
            'Cooking_LPG_PNG', 'assets_Tel', 'assets_CL_WI'
        ]
        
        # Use only available features
        available_features = [col for col in feature_cols if col in district_df.columns]
        
        # Prepare data
        df_clean = district_df.dropna(subset=['Literacy_Rate'] + available_features)
        X, scaler = self.prepare_features(df_clean, available_features)
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
        self.feature_names['literacy_predictor'] = available_features
        
        # Feature importance
        feature_importance = dict(zip(available_features, model.feature_importances_))
        
        return {
            'model_name': 'Enhanced Literacy Rate Predictor',
            'mse': float(mse),
            'r2_score': float(r2),
            'rmse': float(np.sqrt(mse)),
            'feature_importance': feature_importance,
            'test_samples': len(y_test),
            'features_used': available_features,
            'housing_features_included': len([f for f in available_features if f in ['Housing_Quality_Score', 'Modern_Construction_Score', 'Clean_Energy_Score', 'Digital_Assets_Score', 'Infrastructure_Score']])
        }
    
    def train_internet_predictor(self, district_df: pd.DataFrame) -> Dict[str, Any]:
        """Train model to predict internet penetration with housing features."""
        feature_cols = [
            'Literacy_Rate', 'Urbanisation_Rate', 'Mobile_Phone_Access',
            'Households_with_Television', 'Households_with_Computer',
            'Worker_Participation_Rate', 'Population',
            # Housing features (if available)
            'Digital_Assets_Score', 'Clean_Energy_Score', 'Infrastructure_Score',
            'MSL_Electricty', 'assets_Tel', 'assets_CL_WI', 'assets_TM_MO',
            'Modern_Construction_Score', 'Housing_Quality_Score'
        ]
        
        # Use only available features
        available_features = [col for col in feature_cols if col in district_df.columns]
        
        df_clean = district_df.dropna(subset=['Internet_Penetration'] + available_features)
        X, scaler = self.prepare_features(df_clean, available_features)
        y = df_clean['Internet_Penetration'].values
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10)
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        self.models['internet_predictor'] = model
        self.scalers['internet_predictor'] = scaler
        self.feature_names['internet_predictor'] = available_features
        
        feature_importance = dict(zip(available_features, model.feature_importances_))
        
        return {
            'model_name': 'Enhanced Internet Penetration Predictor',
            'mse': float(mse),
            'r2_score': float(r2),
            'rmse': float(np.sqrt(mse)),
            'feature_importance': feature_importance,
            'test_samples': len(y_test),
            'features_used': available_features,
            'housing_features_included': len([f for f in available_features if f in ['Digital_Assets_Score', 'Clean_Energy_Score', 'Infrastructure_Score', 'Housing_Quality_Score']])
        }
    
    def train_sanitation_classifier(self, district_df: pd.DataFrame) -> Dict[str, Any]:
        """Train model to classify sanitation risk levels with housing features."""
        feature_cols = [
            'Literacy_Rate', 'Urbanisation_Rate', 'Population',
            'Worker_Participation_Rate', 'Internet_Penetration',
            # Housing features (if available)
            'Infrastructure_Score', 'Housing_Quality_Score', 'Clean_Energy_Score',
            'Latrine_premise', 'Households_Bathroom', 'Within_premises',
            'Modern_Construction_Score', 'MSL_Electricty'
        ]
        
        # Use only available features
        available_features = [col for col in feature_cols if col in district_df.columns]
        
        # Create risk categories based on sanitation gap
        df_clean = district_df.dropna(subset=['Sanitation_Gap'] + available_features).copy()
        
        # Define risk levels: Low (0-20%), Medium (20-50%), High (>50%)
        df_clean['Sanitation_Risk'] = pd.cut(
            df_clean['Sanitation_Gap'],
            bins=[0, 20, 50, 100],
            labels=['Low', 'Medium', 'High']
        )
        
        X, scaler = self.prepare_features(df_clean, available_features)
        y = df_clean['Sanitation_Risk'].values
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10)
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        accuracy = (y_pred == y_test).mean()
        
        self.models['sanitation_classifier'] = model
        self.scalers['sanitation_classifier'] = scaler
        self.feature_names['sanitation_classifier'] = available_features
        
        feature_importance = dict(zip(available_features, model.feature_importances_))
        
        # Get class distribution
        unique, counts = np.unique(y_test, return_counts=True)
        class_distribution = dict(zip(unique, counts.tolist()))
        
        return {
            'model_name': 'Enhanced Sanitation Risk Classifier',
            'accuracy': float(accuracy),
            'feature_importance': feature_importance,
            'test_samples': len(y_test),
            'class_distribution': class_distribution,
            'features_used': available_features,
            'housing_features_included': len([f for f in available_features if f in ['Infrastructure_Score', 'Housing_Quality_Score', 'Latrine_premise', 'Households_Bathroom']])
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
    
    def train_housing_quality_predictor(self, integrated_df: pd.DataFrame) -> Dict[str, Any]:
        """Train model to predict housing quality score."""
        feature_cols = [
            'Literacy_Rate', 'Urbanisation_Rate', 'Worker_Participation_Rate',
            'Modern_Construction_Score', 'Clean_Energy_Score', 'Infrastructure_Score',
            'MSL_Electricty', 'Cooking_LPG_PNG', 'Material_Roof_Concrete'
        ]
        
        # Check if housing features are available
        available_features = [col for col in feature_cols if col in integrated_df.columns]
        if len(available_features) < 5:
            return {'error': 'Insufficient housing features for training'}
        
        df_clean = integrated_df.dropna(subset=['Housing_Quality_Score'] + available_features)
        X, scaler = self.prepare_features(df_clean, available_features)
        y = df_clean['Housing_Quality_Score'].values
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10)
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        self.models['housing_quality_predictor'] = model
        self.scalers['housing_quality_predictor'] = scaler
        self.feature_names['housing_quality_predictor'] = available_features
        
        feature_importance = dict(zip(available_features, model.feature_importances_))
        
        return {
            'model_name': 'Housing Quality Predictor',
            'mse': float(mse),
            'r2_score': float(r2),
            'rmse': float(np.sqrt(mse)),
            'feature_importance': feature_importance,
            'test_samples': len(y_test),
            'features_used': available_features
        }
    
    def train_asset_ownership_classifier(self, integrated_df: pd.DataFrame) -> Dict[str, Any]:
        """Train model to classify asset ownership levels."""
        feature_cols = [
            'Literacy_Rate', 'Urbanisation_Rate', 'Housing_Quality_Score',
            'Clean_Energy_Score', 'MSL_Electricty', 'Cooking_LPG_PNG'
        ]
        
        available_features = [col for col in feature_cols if col in integrated_df.columns]
        if len(available_features) < 4:
            return {'error': 'Insufficient features for asset ownership classification'}
        
        df_clean = integrated_df.dropna(subset=['Digital_Assets_Score'] + available_features).copy()
        
        # Create asset ownership categories
        df_clean['Asset_Category'] = pd.cut(
            df_clean['Digital_Assets_Score'],
            bins=[0, 20, 50, 100],
            labels=['Low', 'Medium', 'High']
        )
        
        X, scaler = self.prepare_features(df_clean, available_features)
        y = df_clean['Asset_Category'].values
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10)
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        accuracy = (y_pred == y_test).mean()
        
        self.models['asset_ownership_classifier'] = model
        self.scalers['asset_ownership_classifier'] = scaler
        self.feature_names['asset_ownership_classifier'] = available_features
        
        feature_importance = dict(zip(available_features, model.feature_importances_))
        
        unique, counts = np.unique(y_test, return_counts=True)
        class_distribution = dict(zip(unique, counts.tolist()))
        
        return {
            'model_name': 'Asset Ownership Classifier',
            'accuracy': float(accuracy),
            'feature_importance': feature_importance,
            'test_samples': len(y_test),
            'class_distribution': class_distribution,
            'features_used': available_features
        }
    
    def perform_housing_clustering(self, integrated_df: pd.DataFrame, n_clusters: int = 4) -> Dict[str, Any]:
        """Cluster districts based on housing characteristics."""
        feature_cols = [
            'Housing_Quality_Score', 'Modern_Construction_Score', 'Clean_Energy_Score',
            'Digital_Assets_Score', 'Infrastructure_Score', 'Permanents',
            'MSL_Electricty', 'Cooking_LPG_PNG'
        ]
        
        available_features = [col for col in feature_cols if col in integrated_df.columns]
        if len(available_features) < 4:
            return {'error': 'Insufficient housing features for clustering'}
        
        df_clean = integrated_df.dropna(subset=available_features).copy()
        X, scaler = self.prepare_features(df_clean, available_features)
        
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(X)
        
        silhouette = silhouette_score(X, clusters)
        
        df_clean['Housing_Cluster'] = clusters
        self.models['housing_clustering'] = kmeans
        self.scalers['housing_clustering'] = scaler
        self.feature_names['housing_clustering'] = available_features
        
        cluster_profiles = []
        for i in range(n_clusters):
            cluster_data = df_clean[df_clean['Housing_Cluster'] == i]
            profile = {
                'cluster_id': int(i),
                'size': int(len(cluster_data)),
                'avg_housing_quality': float(cluster_data['Housing_Quality_Score'].mean()) if 'Housing_Quality_Score' in cluster_data.columns else 0,
                'avg_modern_construction': float(cluster_data['Modern_Construction_Score'].mean()) if 'Modern_Construction_Score' in cluster_data.columns else 0,
                'avg_clean_energy': float(cluster_data['Clean_Energy_Score'].mean()) if 'Clean_Energy_Score' in cluster_data.columns else 0,
                'avg_digital_assets': float(cluster_data['Digital_Assets_Score'].mean()) if 'Digital_Assets_Score' in cluster_data.columns else 0,
                'districts': cluster_data['District name'].tolist()[:5] if 'District name' in cluster_data.columns else []
            }
            cluster_profiles.append(profile)
        
        return {
            'model_name': 'Housing-based District Clustering',
            'n_clusters': n_clusters,
            'silhouette_score': float(silhouette),
            'cluster_profiles': cluster_profiles,
            'total_districts': len(df_clean),
            'features_used': available_features
        }
    
    def train_infrastructure_predictor(self, integrated_df: pd.DataFrame) -> Dict[str, Any]:
        """Train model to predict infrastructure score."""
        feature_cols = [
            'Literacy_Rate', 'Urbanisation_Rate', 'Population',
            'Housing_Quality_Score', 'Clean_Energy_Score', 'MSL_Electricty'
        ]
        
        available_features = [col for col in feature_cols if col in integrated_df.columns]
        if len(available_features) < 4:
            return {'error': 'Insufficient features for infrastructure prediction'}
        
        df_clean = integrated_df.dropna(subset=['Infrastructure_Score'] + available_features)
        X, scaler = self.prepare_features(df_clean, available_features)
        y = df_clean['Infrastructure_Score'].values
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10)
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        self.models['infrastructure_predictor'] = model
        self.scalers['infrastructure_predictor'] = scaler
        self.feature_names['infrastructure_predictor'] = available_features
        
        feature_importance = dict(zip(available_features, model.feature_importances_))
        
        return {
            'model_name': 'Infrastructure Score Predictor',
            'mse': float(mse),
            'r2_score': float(r2),
            'rmse': float(np.sqrt(mse)),
            'feature_importance': feature_importance,
            'test_samples': len(y_test),
            'features_used': available_features
        }
    
    def predict_housing_quality(self, features: Dict[str, float]) -> float:
        """Predict housing quality score for given features."""
        if 'housing_quality_predictor' not in self.models:
            raise ValueError("Housing quality predictor model not trained")
        
        feature_cols = self.feature_names['housing_quality_predictor']
        X = np.array([[features[col] for col in feature_cols]])
        X_scaled = self.scalers['housing_quality_predictor'].transform(X)
        
        prediction = self.models['housing_quality_predictor'].predict(X_scaled)
        return float(prediction[0])
    
    def classify_asset_ownership(self, features: Dict[str, float]) -> str:
        """Classify asset ownership level for given features."""
        if 'asset_ownership_classifier' not in self.models:
            raise ValueError("Asset ownership classifier model not trained")
        
        feature_cols = self.feature_names['asset_ownership_classifier']
        X = np.array([[features[col] for col in feature_cols]])
        X_scaled = self.scalers['asset_ownership_classifier'].transform(X)
        
        prediction = self.models['asset_ownership_classifier'].predict(X_scaled)
        return str(prediction[0])
    
    def get_housing_cluster(self, features: Dict[str, float]) -> int:
        """Get housing cluster assignment for given features."""
        if 'housing_clustering' not in self.models:
            raise ValueError("Housing clustering model not trained")
        
        feature_cols = self.feature_names['housing_clustering']
        X = np.array([[features[col] for col in feature_cols]])
        X_scaled = self.scalers['housing_clustering'].transform(X)
        
        cluster = self.models['housing_clustering'].predict(X_scaled)
        return int(cluster[0])
    
    def load_models(self, input_dir: Path):
        """Load trained models from disk."""
        for model_file in input_dir.glob("*.joblib"):
            if "scaler" not in model_file.name:
                model_name = model_file.stem
                self.models[model_name] = joblib.load(model_file)
            else:
                scaler_name = model_file.stem.replace("_scaler", "")
                self.scalers[scaler_name] = joblib.load(model_file)


def prepare_housing_features(housing_df: pd.DataFrame) -> pd.DataFrame:
    """Prepare housing data features for ML integration."""
    # Aggregate housing data by district for integration with district data
    housing_features = housing_df.groupby(['State Name', 'District Name']).agg({
        # Housing condition metrics
        'Total Number of Good': 'mean',
        'Total Number of Livable': 'mean', 
        'Total Number of Dilapidated': 'mean',
        
        # Construction materials (quality indicators)
        'Material_Roof_Concrete': 'mean',
        'Material_Wall_Concrete': 'mean',
        'Material_Floor_Cement': 'mean',
        'Material_Floor_MF': 'mean',  # Mosaic/Floor tiles
        
        # Utilities and amenities
        'MSL_Electricty': 'mean',
        'Cooking_LPG_PNG': 'mean',
        'Cooking_Electricity': 'mean',
        'Cooking_FW': 'mean',  # Firewood (traditional fuel)
        
        # Water and sanitation
        'Within_premises': 'mean',  # Water within premises
        'Latrine_premise': 'mean',  # Latrine within premises
        'Households_Bathroom': 'mean',
        
        # Assets
        'assets_RT': 'mean',  # Radio/Transistor
        'assets_Tel': 'mean',  # Television
        'assets_CL_WI': 'mean',  # Computer with Internet
        'assets_CLWI': 'mean',  # Computer without Internet
        'assets_TM_MO': 'mean',  # Mobile phone
        'assets_Bicycle': 'mean',
        'assets_SMM': 'mean',  # Scooter/Motorcycle
        'assets_CJV': 'mean',  # Car/Jeep/Van
        
        # Housing structure
        'Permanents': 'mean',
        'Semi_Permanent': 'mean',
        'Total_Temporary': 'mean',
        
        # Household size distribution
        'H_size_1': 'mean',
        'H_size_2': 'mean',
        'H_size_3': 'mean',
        'H_size_4': 'mean',
        'H_size_5': 'mean',
        'H_size_6_8': 'mean',
        'H_size_9': 'mean'
    }).reset_index()
    
    # Calculate derived housing metrics
    housing_features['Housing_Quality_Score'] = (
        housing_features['Total Number of Good'] * 1.0 +
        housing_features['Total Number of Livable'] * 0.6 +
        housing_features['Total Number of Dilapidated'] * 0.2
    )
    
    housing_features['Modern_Construction_Score'] = (
        housing_features['Material_Roof_Concrete'] +
        housing_features['Material_Wall_Concrete'] +
        housing_features['Material_Floor_Cement'] +
        housing_features['Material_Floor_MF']
    ) / 4
    
    housing_features['Clean_Energy_Score'] = (
        housing_features['Cooking_LPG_PNG'] +
        housing_features['Cooking_Electricity'] +
        housing_features['MSL_Electricty']
    ) / 3
    
    housing_features['Digital_Assets_Score'] = (
        housing_features['assets_CL_WI'] +
        housing_features['assets_CLWI'] +
        housing_features['assets_TM_MO'] +
        housing_features['assets_Tel']
    ) / 4
    
    housing_features['Infrastructure_Score'] = (
        housing_features['Within_premises'] +
        housing_features['Latrine_premise'] +
        housing_features['Households_Bathroom']
    ) / 3
    
    return housing_features

def integrate_district_housing_data(district_df: pd.DataFrame, housing_df: pd.DataFrame) -> pd.DataFrame:
    """Integrate district metrics with housing features."""
    # Prepare housing features
    housing_features = prepare_housing_features(housing_df)
    
    # Merge with district data
    integrated_df = district_df.merge(
        housing_features,
        left_on=['State name', 'District name'],
        right_on=['State Name', 'District Name'],
        how='left'
    )
    
    # Drop duplicate columns
    integrated_df = integrated_df.drop(['State Name', 'District Name'], axis=1)
    
    # Fill missing values with median
    numeric_cols = integrated_df.select_dtypes(include=[np.number]).columns
    integrated_df[numeric_cols] = integrated_df[numeric_cols].fillna(integrated_df[numeric_cols].median())
    
    return integrated_df

def train_all_models(district_df: pd.DataFrame, housing_df: pd.DataFrame = None) -> Dict[str, Any]:
    """Train all ML models with integrated district and housing data."""
    ml_manager = MLModelManager()
    
    # If housing data is provided, integrate it with district data
    if housing_df is not None:
        print("🏠 Integrating housing data with district metrics...")
        integrated_df = integrate_district_housing_data(district_df, housing_df)
        print(f"✅ Integrated dataset shape: {integrated_df.shape}")
    else:
        integrated_df = district_df
        print("⚠️  Training models on district data only")
    
    results = {
        'literacy_prediction': ml_manager.train_literacy_predictor(integrated_df),
        'internet_prediction': ml_manager.train_internet_predictor(integrated_df),
        'sanitation_classification': ml_manager.train_sanitation_classifier(integrated_df),
        'district_clustering': ml_manager.perform_district_clustering(integrated_df, n_clusters=5),
        'anomaly_detection': ml_manager.detect_anomalies(integrated_df),
        'pca_analysis': ml_manager.perform_pca_analysis(integrated_df)
    }
    
    # Add housing-specific models if housing data is available
    if housing_df is not None:
        results.update({
            'housing_quality_prediction': ml_manager.train_housing_quality_predictor(integrated_df),
            'asset_ownership_classification': ml_manager.train_asset_ownership_classifier(integrated_df),
            'housing_clustering': ml_manager.perform_housing_clustering(integrated_df),
            'infrastructure_score_prediction': ml_manager.train_infrastructure_predictor(integrated_df)
        })
    
    return results, ml_manager
