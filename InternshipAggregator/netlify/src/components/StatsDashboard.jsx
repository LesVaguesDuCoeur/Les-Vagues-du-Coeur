import React from 'react';
import PropTypes from 'prop-types';
import { BarChart, PieChart } from 'lucide-react';
import './StatsDashboard.css';

const StatsDashboard = ({ jobs }) => {
  const total = jobs.length;

  const byCategory = jobs.reduce((acc, job) => {
    acc[job.category] = (acc[job.category] || 0) + 1;
    return acc;
  }, {});

  const bySource = jobs.reduce((acc, job) => {
    // Simplify source name
    const source = job.source.split(' ')[0];
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="stats-dashboard">
      <div className="stat-card total">
        <h4>Total Offres</h4>
        <div className="stat-value">{total}</div>
      </div>

      <div className="stat-card">
        <h4><PieChart size={16} /> Par Catégorie</h4>
        <div className="stat-list">
          {Object.entries(byCategory).map(([cat, count]) => (
            <div key={cat} className="stat-row">
              <span className="stat-label">{cat}</span>
              <span className="stat-count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="stat-card">
        <h4><BarChart size={16} /> Top Sources</h4>
        <div className="stat-list">
          {Object.entries(bySource).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([src, count]) => (
            <div key={src} className="stat-row">
              <span className="stat-label">{src}</span>
              <span className="stat-count">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

StatsDashboard.propTypes = {
  jobs: PropTypes.array.isRequired,
};

export default StatsDashboard;
