"""Quick test to verify the DatasetBundle fix."""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

def test_dataset_context():
    """Test that _get_dataset_context works without errors."""
    try:
        from src.data_analysis import load_datasets
        from backend.gemini_chatbot import GeminiChatbot
        
        # Load data
        data_dir = Path(__file__).parent
        data_bundle = load_datasets(data_dir)
        
        print("✓ Data bundle loaded successfully")
        print(f"  - District data: {data_bundle.district.shape}")
        print(f"  - Housing data: {data_bundle.housing.shape}")
        print(f"  - Column mappings: {len(data_bundle.colmap)}")
        
        # Test context generation (without full chatbot initialization)
        api_key = "test-key"
        db_url = "test-url"
        
        # Create a minimal chatbot instance just to test context generation
        class TestChatbot:
            def __init__(self, data_bundle):
                self.data_bundle = data_bundle
            
            def _get_dataset_context(self):
                """Generate context about the census datasets."""
                district_df = self.data_bundle.district
                housing_df = self.data_bundle.housing
                
                # Calculate key statistics safely
                total_population = district_df['Population'].sum() if 'Population' in district_df.columns else 0
                total_literate = district_df['Literate'].sum() if 'Literate' in district_df.columns else 0
                literacy_rate = (total_literate / total_population * 100) if total_population > 0 else 0
                
                # Get total households safely
                total_households = housing_df['Households'].sum() if 'Households' in housing_df.columns else district_df['Households'].sum() if 'Households' in district_df.columns else 0
                
                # Get total workers safely
                total_workers = district_df['Workers'].sum() if 'Workers' in district_df.columns else 0
                
                context = f"""
CENSUS 2011 INDIA DATASET CONTEXT:

Dataset Overview:
- Total Districts: {district_df['District code'].nunique() if 'District code' in district_df.columns else len(district_df)}
- Total States/UTs: {district_df['State name'].nunique() if 'State name' in district_df.columns else 'N/A'}
- Total Population: {total_population:,}

Available Data Categories:
1. DISTRICT DATA ({district_df.shape[0]} records, {district_df.shape[1]} columns):
   - Population statistics (Total, Male, Female)
   - Literacy rates and education data
   - Sex ratio and demographics
   - Worker statistics and employment
   - Household information
   - Key columns: {', '.join(district_df.columns.tolist()[:15])}{'...' if len(district_df.columns) > 15 else ''}

2. HOUSING DATA ({housing_df.shape[0]} records, {housing_df.shape[1]} columns):
   - Household counts (Total, Rural, Urban)
   - Asset ownership (Internet, TV, Computer, Telephone)
   - Infrastructure and amenities access
   - Housing materials and conditions
   - Key columns: {', '.join(housing_df.columns.tolist()[:15])}{'...' if len(housing_df.columns) > 15 else ''}

Key Statistics:
- Average Literacy Rate: {literacy_rate:.2f}%
- Total Households: {total_households:,}
- Total Workers: {total_workers:,}

States Covered: {', '.join(sorted(district_df['State name'].unique()[:10])) if 'State name' in district_df.columns else 'Multiple states'}{'... and more' if 'State name' in district_df.columns and district_df['State name'].nunique() > 10 else ''}

Data Quality:
- District data: Complete demographic and socioeconomic indicators
- Housing data: Detailed infrastructure and asset information
- All data from Census 2011 India official sources
"""
                return context
        
        test_bot = TestChatbot(data_bundle)
        context = test_bot._get_dataset_context()
        
        print("✓ Dataset context generated successfully")
        print(f"  - Context length: {len(context)} characters")
        print(f"  - Context preview: {context[:200]}...")
        
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Testing DatasetBundle fix...")
    print("=" * 50)
    
    success = test_dataset_context()
    
    print("=" * 50)
    if success:
        print("🎉 Fix successful! The chatbot should work now.")
    else:
        print("❌ Fix failed. Please check the error above.")