import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import FilterSidebar from './components/FilterSidebar';
import JobCard from './components/JobCard';
import StatsDashboard from './components/StatsDashboard';
import { jobService } from './services/jobService';
import { api } from './services/api';
import './App.css';

function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [excludeSchools, setExcludeSchools] = useState(true);

  const [filters, setFilters] = useState({
    search: '',
    contract: 'Tous',
    category: 'Toutes',
    location: '',
    studyLevel: 'Tous'
  });

  useEffect(() => {
    fetchJobs();
    // Check system preference for dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await jobService.getJobs();
      setJobs(data.jobs);
    } catch (error) {
      console.error("Failed to fetch jobs", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (job) => {
    // Optimistic update
    const newStatus = !job.isSaved;
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, isSaved: newStatus } : j));

    if (newStatus) {
      await api.saveAction('saveJob', job);
    } else {
      await api.saveAction('removeSavedJob', { id: job.id });
    }
  };

  const handleApply = async (job) => {
    const newStatus = !job.isApplied;
    const date = new Date().toISOString();
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, isApplied: newStatus, appliedDate: date } : j));

    if (newStatus) {
      await api.saveAction('markApplied', { id: job.id, date });
    }
  };

  const handleHide = async (job) => {
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, isHidden: true } : j));
    await api.saveAction('hideJob', { id: job.id });
  };

  const handleCopy = (id) => {
    // Already handled in component, maybe show toast here?
    console.log("Copied job", id);
  };

  const filteredJobs = useMemo(() => {
    let filtered = jobService.filterJobs(jobs, filters, excludeSchools);

    if (activeTab === 'saved') {
      filtered = filtered.filter(j => j.isSaved);
    } else if (activeTab === 'applied') {
      filtered = filtered.filter(j => j.isApplied);
    }

    return jobService.sortJobs(filtered, 'recent');
  }, [jobs, filters, excludeSchools, activeTab]);

  return (
    <div className={`app-container ${darkMode ? 'dark' : ''}`}>
      <Header
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="main-content">
        <aside className="sidebar-area">
          <FilterSidebar
            filters={filters}
            onFilterChange={setFilters}
            excludeSchools={excludeSchools}
            onToggleSchools={setExcludeSchools}
          />
        </aside>

        <main className="content-area">
          <div className="content-wrapper">
            <StatsDashboard jobs={filteredJobs} />

            {loading ? (
              <div className="loading">Chargement des offres...</div>
            ) : (
              <div className="job-feed">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map(job => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onSave={handleSave}
                      onApply={handleApply}
                      onHide={handleHide}
                      onCopy={handleCopy}
                    />
                  ))
                ) : (
                  <div className="no-results">
                    <p>Aucune offre ne correspond à vos critères.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
