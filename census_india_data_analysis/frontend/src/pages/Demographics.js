import React, { useState, useEffect } from 'react';
import { Users, TrendingUp } from 'lucide-react';
import { getDemographics, getPlotlyChart } from '../services/api';
import Plot from 'react-plotly.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Demographics = () => {
  const [data, setData] = useState(null);
  const [scatterChart, setScatterChart] = useState(null);
  const [boxChart, setBoxChart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [demographicsData, scatter, box] = await Promise.all([
          getDemographics(),
          getPlotlyChart('literacy_scatter'),
          getPlotlyChart('sex_ratio_box')
        ]);
        setData(demographicsData);
        setScatterChart(scatter);
        setBoxChart(box);
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
        <div className="loading">Loading demographics data...</div>
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

  // Prepare data for recharts
  const populationData = data.top_states_population.labels.map((label, index) => ({
    state: label.length > 15 ? label.substring(0, 15) + '...' : label,
    population: data.top_states_population.values[index],
  }));

  const sexRatioData = data.sex_ratio_by_state.labels.map((label, index) => ({
    state: label.length > 15 ? label.substring(0, 15) + '...' : label,
    ratio: data.sex_ratio_by_state.values[index],
  }));

  return (
    <div className="page-container">
      <h1 className="page-title">Demographics Analysis</h1>
      <p className="page-subtitle">
        Population distribution, sex ratio, and literacy statistics across India
      </p>

      <div className="card">
        <h2 className="card-title">
          <Users size={24} />
          Top 10 States by Population
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={populationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="state" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip formatter={(value) => value.toLocaleString()} />
            <Legend />
            <Bar dataKey="population" fill="#667eea" name="Population" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2 className="card-title">
          <TrendingUp size={24} />
          Sex Ratio by State (Top 15)
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={sexRatioData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="state" type="category" width={150} />
            <Tooltip />
            <Legend />
            <Bar dataKey="ratio" fill="#764ba2" name="Sex Ratio (Females per 1000 Males)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {scatterChart && (
        <div className="card">
          <h2 className="card-title">Literacy Rate vs Worker Participation</h2>
          <Plot
            data={scatterChart.data}
            layout={{
              ...scatterChart.layout,
              autosize: true,
              height: 500,
            }}
            style={{ width: '100%' }}
            useResizeHandler={true}
          />
        </div>
      )}

      {boxChart && (
        <div className="card">
          <h2 className="card-title">Sex Ratio Distribution</h2>
          <Plot
            data={boxChart.data}
            layout={{
              ...boxChart.layout,
              autosize: true,
              height: 500,
            }}
            style={{ width: '100%' }}
            useResizeHandler={true}
          />
        </div>
      )}

      <div className="card">
        <h2 className="card-title">Literacy Rate Distribution</h2>
        <div style={{ padding: '1rem' }}>
          {data.literacy_distribution.labels.map((label, index) => (
            <div key={index} style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 'bold' }}>{label}</span>
                <span>{data.literacy_distribution.values[index]} districts</span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '30px', 
                background: '#f0f0f0', 
                borderRadius: '5px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${(data.literacy_distribution.values[index] / Math.max(...data.literacy_distribution.values)) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Demographics;
