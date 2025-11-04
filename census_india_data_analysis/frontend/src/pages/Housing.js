import React, { useState, useEffect } from 'react';
import { Building2, Wifi, Tv } from 'lucide-react';
import { getHousing, getPlotlyChart } from '../services/api';
import Plot from 'react-plotly.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Housing = () => {
  const [data, setData] = useState(null);
  const [pieChart, setPieChart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [housingData, pie] = await Promise.all([
          getHousing(),
          getPlotlyChart('urbanisation_pie')
        ]);
        setData(housingData);
        setPieChart(pie);
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
        <div className="loading">Loading housing data...</div>
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

  // Prepare asset access data
  const assetData = Object.entries(data.asset_access).map(([key, value]) => ({
    name: key.replace(/_/g, ' '),
    value: parseFloat(value.toFixed(2)),
  }));

  // Prepare urbanisation data
  const urbanisationData = data.urbanisation_by_state.labels.map((label, index) => ({
    state: label.length > 15 ? label.substring(0, 15) + '...' : label,
    rate: data.urbanisation_by_state.values[index],
  }));

  return (
    <div className="page-container">
      <h1 className="page-title">Housing & Infrastructure</h1>
      <p className="page-subtitle">
        Analysis of household amenities, infrastructure, and urbanisation patterns
      </p>

      <div className="grid grid-3">
        <div className="stat-card">
          <Wifi size={32} />
          <div className="stat-value">
            {data.asset_access.Internet?.toFixed(1) || 'N/A'}%
          </div>
          <div className="stat-label">Internet Access</div>
        </div>

        <div className="stat-card">
          <Tv size={32} />
          <div className="stat-value">
            {data.asset_access.Television?.toFixed(1) || 'N/A'}%
          </div>
          <div className="stat-label">Television Access</div>
        </div>

        <div className="stat-card">
          <Building2 size={32} />
          <div className="stat-value">
            {data.sanitation_coverage.toFixed(1)}%
          </div>
          <div className="stat-label">Sanitation Coverage</div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">
          <Building2 size={24} />
          Household Asset Access Rates
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={assetData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend />
            <Bar dataKey="value" fill="#667eea" name="Access Rate (%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2 className="card-title">Top 10 States by Urbanisation Rate</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={urbanisationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="state" angle={-45} textAnchor="end" height={100} />
            <YAxis label={{ value: 'Urbanisation Rate (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
            <Legend />
            <Bar dataKey="rate" fill="#764ba2" name="Urbanisation Rate (%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {pieChart && (
        <div className="card">
          <h2 className="card-title">Urban vs Rural Distribution</h2>
          <Plot
            data={pieChart.data}
            layout={{
              ...pieChart.layout,
              autosize: true,
              height: 500,
            }}
            style={{ width: '100%' }}
            useResizeHandler={true}
          />
        </div>
      )}

      <div className="card">
        <h2 className="card-title">Infrastructure Insights</h2>
        <div style={{ padding: '1rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#667eea', marginBottom: '0.5rem' }}>Digital Connectivity</h3>
            <p style={{ color: '#666', lineHeight: '1.6' }}>
              {data.asset_access.Internet?.toFixed(2)}% of households have internet access, while{' '}
              {data.asset_access['Telephone_Mobile_Phone']?.toFixed(2)}% have telephone or mobile phone access.
              This indicates significant digital infrastructure development across the country.
            </p>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#667eea', marginBottom: '0.5rem' }}>Sanitation Facilities</h3>
            <p style={{ color: '#666', lineHeight: '1.6' }}>
              {data.sanitation_coverage.toFixed(2)}% of households have access to sanitation facilities
              within their premises, showing progress in public health infrastructure.
            </p>
          </div>
          <div>
            <h3 style={{ color: '#667eea', marginBottom: '0.5rem' }}>Modern Amenities</h3>
            <p style={{ color: '#666', lineHeight: '1.6' }}>
              Television access stands at {data.asset_access.Television?.toFixed(2)}%, while computer/laptop
              ownership is at {data.asset_access['Computer_Laptop']?.toFixed(2)}%, reflecting varying levels
              of technology adoption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Housing;
