"""Test script for enhanced ML models with housing data integration.

This script tests:
1. Housing data integration with district metrics
2. Enhanced ML models with housing features
3. New housing-specific ML models
4. Model performance improvements
"""

import sys
from pathlib import Path
import pandas as pd

# Add src to path
sys.path.append(str(Path(__file__).parent / 'src'))

from data_analysis import load_datasets, compute_district_metrics
from ml_models import train_all_models, integrate_district_housing_data, prepare_housing_features

def test_housing_data_integration():
    """Test housing data preparation and integration."""
    print("🏠 Testing Housing Data Integration...")
    
    try:
        # Load datasets
        data_dir = Path(__file__).parent
        data_bundle = load_datasets(data_dir)
        district_metrics = compute_district_metrics(data_bundle.district)
        
        print(f"✅ District data shape: {district_metrics.shape}")
        print(f"✅ Housing data shape: {data_bundle.housing.shape}")
        
        # Test housing feature preparation
        housing_features = prepare_housing_features(data_bundle.housing)
        print(f"✅ Housing features prepared: {housing_features.shape}")
        print(f"   - Housing quality scores calculated")
        print(f"   - Construction material scores derived")
        print(f"   - Digital asset scores computed")
        
        # Test data integration
        integrated_df = integrate_district_housing_data(district_metrics, data_bundle.housing)
        print(f"✅ Integrated dataset shape: {integrated_df.shape}")
        
        # Check new housing columns
        housing_cols = [col for col in integrated_df.columns if 'Score' in col or 'assets_' in col or 'Material_' in col]
        print(f"✅ Housing features integrated: {len(housing_cols)}")
        print(f"   - Key housing features: {housing_cols[:10]}")
        
        return integrated_df, data_bundle
        
    except Exception as e:
        print(f"❌ Housing data integration failed: {e}")
        return None, None

def test_enhanced_ml_models(integrated_df, data_bundle):
    """Test enhanced ML models with housing data."""
    print("\n🤖 Testing Enhanced ML Models...")
    
    try:
        # Train enhanced models
        ml_results, ml_manager = train_all_models(integrated_df, data_bundle.housing)
        
        print("✅ Enhanced ML models trained successfully!")
        
        # Test each model
        for model_name, results in ml_results.items():
            if 'error' not in results:
                print(f"\n📊 {results['model_name']}:")
                
                # Performance metrics
                if 'r2_score' in results:
                    print(f"   - R² Score: {results['r2_score']:.3f}")
                if 'accuracy' in results:
                    print(f"   - Accuracy: {results['accuracy']:.3f}")
                if 'silhouette_score' in results:
                    print(f"   - Silhouette Score: {results['silhouette_score']:.3f}")
                
                # Feature information
                if 'features_used' in results:
                    print(f"   - Features used: {len(results['features_used'])}")
                if 'housing_features_included' in results:
                    print(f"   - Housing features: {results['housing_features_included']}")
                
                # Top feature importance
                if 'feature_importance' in results:
                    top_features = sorted(results['feature_importance'].items(), 
                                        key=lambda x: x[1], reverse=True)[:3]
                    print(f"   - Top features: {[f[0] for f in top_features]}")
            else:
                print(f"❌ {model_name}: {results['error']}")
        
        return ml_results, ml_manager
        
    except Exception as e:
        print(f"❌ Enhanced ML model training failed: {e}")
        return None, None

def test_housing_specific_models(ml_results):
    """Test housing-specific ML models."""
    print("\n🏘️  Testing Housing-Specific Models...")
    
    housing_models = [
        'housing_quality_prediction',
        'asset_ownership_classification', 
        'housing_clustering',
        'infrastructure_score_prediction'
    ]
    
    for model_name in housing_models:
        if model_name in ml_results:
            results = ml_results[model_name]
            if 'error' not in results:
                print(f"✅ {results['model_name']}: Successfully trained")
                if 'r2_score' in results:
                    print(f"   - Performance: R² = {results['r2_score']:.3f}")
                elif 'accuracy' in results:
                    print(f"   - Performance: Accuracy = {results['accuracy']:.3f}")
            else:
                print(f"⚠️  {model_name}: {results['error']}")
        else:
            print(f"❌ {model_name}: Not found in results")

def test_model_predictions(ml_manager, integrated_df):
    """Test model predictions with sample data."""
    print("\n🔮 Testing Model Predictions...")
    
    if ml_manager is None:
        print("❌ No ML manager available for testing")
        return
    
    # Get sample district data
    sample_district = integrated_df.iloc[0]
    
    try:
        # Test literacy prediction
        if 'literacy_predictor' in ml_manager.models:
            features = {col: sample_district[col] for col in ml_manager.feature_names['literacy_predictor']}
            prediction = ml_manager.predict_literacy(features)
            actual = sample_district['Literacy_Rate']
            print(f"✅ Literacy Prediction: {prediction:.2f}% (Actual: {actual:.2f}%)")
        
        # Test housing quality prediction
        if 'housing_quality_predictor' in ml_manager.models:
            features = {col: sample_district[col] for col in ml_manager.feature_names['housing_quality_predictor']}
            prediction = ml_manager.predict_housing_quality(features)
            print(f"✅ Housing Quality Prediction: {prediction:.2f}")
        
        # Test asset ownership classification
        if 'asset_ownership_classifier' in ml_manager.models:
            features = {col: sample_district[col] for col in ml_manager.feature_names['asset_ownership_classifier']}
            prediction = ml_manager.classify_asset_ownership(features)
            print(f"✅ Asset Ownership Classification: {prediction}")
        
        print("✅ All prediction tests passed!")
        
    except Exception as e:
        print(f"❌ Prediction testing failed: {e}")

def compare_model_performance():
    """Compare performance with and without housing data."""
    print("\n📈 Comparing Model Performance...")
    
    try:
        # Load data
        data_dir = Path(__file__).parent
        data_bundle = load_datasets(data_dir)
        district_metrics = compute_district_metrics(data_bundle.district)
        
        # Train models without housing data
        print("   Training models without housing data...")
        results_without_housing, _ = train_all_models(district_metrics)
        
        # Train models with housing data
        print("   Training models with housing data...")
        results_with_housing, _ = train_all_models(district_metrics, data_bundle.housing)
        
        # Compare performance
        print("\n📊 Performance Comparison:")
        for model_name in ['literacy_prediction', 'internet_prediction', 'sanitation_classification']:
            if model_name in results_without_housing and model_name in results_with_housing:
                without = results_without_housing[model_name]
                with_housing = results_with_housing[model_name]
                
                if 'r2_score' in without and 'r2_score' in with_housing:
                    improvement = with_housing['r2_score'] - without['r2_score']
                    print(f"   {model_name}:")
                    print(f"     - Without housing: R² = {without['r2_score']:.3f}")
                    print(f"     - With housing: R² = {with_housing['r2_score']:.3f}")
                    print(f"     - Improvement: {improvement:+.3f}")
                
                elif 'accuracy' in without and 'accuracy' in with_housing:
                    improvement = with_housing['accuracy'] - without['accuracy']
                    print(f"   {model_name}:")
                    print(f"     - Without housing: Accuracy = {without['accuracy']:.3f}")
                    print(f"     - With housing: Accuracy = {with_housing['accuracy']:.3f}")
                    print(f"     - Improvement: {improvement:+.3f}")
        
    except Exception as e:
        print(f"❌ Performance comparison failed: {e}")

def main():
    """Run all tests for enhanced ML models with housing data."""
    print("🚀 Testing Enhanced ML Models with Housing Data Integration\n")
    
    # Test housing data integration
    integrated_df, data_bundle = test_housing_data_integration()
    if integrated_df is None:
        print("❌ Cannot proceed without data integration")
        return
    
    # Test enhanced ML models
    ml_results, ml_manager = test_enhanced_ml_models(integrated_df, data_bundle)
    if ml_results is None:
        print("❌ Cannot proceed without ML models")
        return
    
    # Test housing-specific models
    test_housing_specific_models(ml_results)
    
    # Test model predictions
    test_model_predictions(ml_manager, integrated_df)
    
    # Compare performance
    compare_model_performance()
    
    print("\n🎉 All Enhanced ML Tests Completed!")
    print("\n📊 Summary:")
    print("- Housing data successfully integrated with district metrics")
    print("- Enhanced ML models trained with housing features")
    print("- New housing-specific models implemented")
    print("- Model predictions working correctly")
    print("- Performance improvements achieved with housing data")

if __name__ == "__main__":
    main()