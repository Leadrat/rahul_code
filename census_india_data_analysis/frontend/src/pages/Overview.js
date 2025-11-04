import React, { useState, useEffect } from 'react';
import { Users, MapPin, Home, TrendingUp } from 'lucide-react';
import { getOverview } from '../services/api';
import Plot from 'react-plotly.js';
import { getPlotlyChart } from '../services/api';

const Overview = () => {
  const [data, setData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [overviewData, populationChart] = await Promise.all([
          getOverview(),
          getPlotlyChart('population_map')
        ]);
        setData(overviewData);
        setChartData(populationChart);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Loading overview data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">India Census Data Overview</h1>
      <p className="page-subtitle">
        Comprehensive analysis of India's 2011 Census housing and demographic data
      </p>

      <div className="grid grid-3">
        <div className="stat-card">
          <Users size={32} />
          <div className="stat-value">
            {(data.district_data.total_population / 1000000).toFixed(0)}M
          </div>
          <div className="stat-label">Total Population</div>
        </div>

        <div className="stat-card">
          <MapPin size={32} />
          <div className="stat-value">{data.district_data.total_states}</div>
          <div className="stat-label">States & UTs</div>
        </div>

        <div className="stat-card">
          <Home size={32} />
          <div className="stat-value">{data.district_data.total_districts}</div>
          <div className="stat-label">Districts</div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">
          <TrendingUp size={24} />
          Key Metrics
        </h2>
        <div className="grid grid-3">
          <div>
            <h3 style={{ color: '#667eea', fontSize: '2rem', fontWeight: 'bold' }}>
              {data.key_metrics.avg_literacy_rate.toFixed(2)}%
            </h3>
            <p style={{ color: '#666' }}>Average Literacy Rate</p>
          </div>
          <div>
            <h3 style={{ color: '#667eea', fontSize: '2rem', fontWeight: 'bold' }}>
              {data.key_metrics.avg_sex_ratio.toFixed(0)}
            </h3>
            <p style={{ color: '#666' }}>Average Sex Ratio</p>
          </div>
          <div>
            <h3 style={{ color: '#667eea', fontSize: '2rem', fontWeight: 'bold' }}>
              {data.key_metrics.avg_urbanisation.toFixed(2)}%
            </h3>
            <p style={{ color: '#666' }}>Average Urbanisation</p>
          </div>
        </div>
      </div>

      {chartData && (
        <div className="card">
          <h2 className="card-title">Population Distribution by State</h2>
          <Plot
            data={chartData.data}
            layout={{
              ...chartData.layout,
              autosize: true,
              height: 500,
            }}
            style={{ width: '100%' }}
            useResizeHandler={true}
          />
        </div>
      )}

      <div className="card">
        <h2 className="card-title">Dataset Information</h2>
        <div className="grid grid-2">
          <div>
            <h3 style={{ color: '#333', marginBottom: '0.5rem' }}>District Data</h3>
            <p style={{ color: '#666' }}>
              <strong>Rows:</strong> {data.district_data.total_rows.toLocaleString()}
            </p>
            <p style={{ color: '#666' }}>
              <strong>Columns:</strong> {data.district_data.total_columns}
            </p>
          </div>
          <div>
            <h3 style={{ color: '#333', marginBottom: '0.5rem' }}>Housing Data</h3>
            <p style={{ color: '#666' }}>
              <strong>Rows:</strong> {data.housing_data.total_rows.toLocaleString()}
            </p>
            <p style={{ color: '#666' }}>
              <strong>Columns:</strong> {data.housing_data.total_columns}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
