import React, { useState, useEffect } from 'react';
import { Briefcase, TrendingUp, Users } from 'lucide-react';
import { getWorkforce } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#667eea', '#764ba2'];

const Workforce = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const workforceData = await getWorkforce();
        setData(workforceData);
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
        <div className="loading">Loading workforce data...</div>
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

  // Prepare worker participation data
  const participationData = data.worker_participation_by_state.labels.map((label, index) => ({
    state: label.length > 15 ? label.substring(0, 15) + '...' : label,
    rate: data.worker_participation_by_state.values[index],
  }));

  // Prepare gender distribution data
  const genderData = [
    { name: 'Male Workers', value: data.gender_distribution.male_workers },
    { name: 'Female Workers', value: data.gender_distribution.female_workers },
  ];

  const totalWorkers = data.gender_distribution.male_workers + data.gender_distribution.female_workers;
  const femalePercentage = ((data.gender_distribution.female_workers / totalWorkers) * 100).toFixed(2);
  const malePercentage = ((data.gender_distribution.male_workers / totalWorkers) * 100).toFixed(2);

  return (
    <div className="page-container">
      <h1 className="page-title">Workforce Analysis</h1>
      <p className="page-subtitle">
        Employment patterns, worker participation rates, and gender distribution
      </p>

      <div className="grid grid-3">
        <div className="stat-card">
          <Briefcase size={32} />
          <div className="stat-value">
            {(totalWorkers / 1000000).toFixed(1)}M
          </div>
          <div className="stat-label">Total Workers</div>
        </div>

        <div className="stat-card">
          <Users size={32} />
          <div className="stat-value">
            {femalePercentage}%
          </div>
          <div className="stat-label">Female Participation</div>
        </div>

        <div className="stat-card">
          <TrendingUp size={32} />
          <div className="stat-value">
            {(data.literacy_workforce_correlation * 100).toFixed(1)}%
          </div>
          <div className="stat-label">Literacy-Work Correlation</div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">
          <Briefcase size={24} />
          Worker Participation Rate by State (Top 15)
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={participationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="state" angle={-45} textAnchor="end" height={100} />
            <YAxis label={{ value: 'Participation Rate (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
            <Legend />
            <Bar dataKey="rate" fill="#667eea" name="Worker Participation Rate (%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2 className="card-title">
            <Users size={24} />
            Gender Distribution in Workforce
          </h2>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => value.toLocaleString()} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <p style={{ color: '#666' }}>
              <strong>Male:</strong> {data.gender_distribution.male_workers.toLocaleString()} ({malePercentage}%)
            </p>
            <p style={{ color: '#666' }}>
              <strong>Female:</strong> {data.gender_distribution.female_workers.toLocaleString()} ({femalePercentage}%)
            </p>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">
            <TrendingUp size={24} />
            Key Insights
          </h2>
          <div style={{ padding: '1rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#667eea', marginBottom: '0.5rem' }}>Literacy Impact</h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                The correlation between literacy rate and worker participation is{' '}
                {(data.literacy_workforce_correlation * 100).toFixed(1)}%, indicating a{' '}
                {data.literacy_workforce_correlation > 0.5 ? 'strong' : 'moderate'} positive
                relationship between education and employment.
              </p>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#667eea', marginBottom: '0.5rem' }}>Gender Gap</h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Female workers constitute {femalePercentage}% of the total workforce,
                highlighting the gender disparity in employment across India.
              </p>
            </div>
            <div>
              <h3 style={{ color: '#667eea', marginBottom: '0.5rem' }}>Regional Variations</h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Worker participation rates vary significantly across states, reflecting
                diverse economic conditions and employment opportunities.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Workforce Statistics Summary</h2>
        <div className="grid grid-2" style={{ padding: '1rem' }}>
          <div>
            <h3 style={{ color: '#333', marginBottom: '1rem' }}>Employment Overview</h3>
            <ul style={{ color: '#666', lineHeight: '2' }}>
              <li>Total workforce: {totalWorkers.toLocaleString()} workers</li>
              <li>Male workers: {data.gender_distribution.male_workers.toLocaleString()}</li>
              <li>Female workers: {data.gender_distribution.female_workers.toLocaleString()}</li>
            </ul>
          </div>
          <div>
            <h3 style={{ color: '#333', marginBottom: '1rem' }}>Key Findings</h3>
            <ul style={{ color: '#666', lineHeight: '2' }}>
              <li>Literacy-workforce correlation: {(data.literacy_workforce_correlation * 100).toFixed(1)}%</li>
              <li>Female participation: {femalePercentage}% of total workforce</li>
              <li>Coverage: {data.worker_participation_by_state.labels.length}+ states analyzed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workforce;
