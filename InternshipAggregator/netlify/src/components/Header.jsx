import React from 'react';
import PropTypes from 'prop-types';
import { Briefcase, Moon, Sun, Heart, CheckCircle } from 'lucide-react';
import './Header.css';

const Header = ({ darkMode, toggleDarkMode, activeTab, onTabChange }) => {
  return (
    <header className="header">
      <div className="header-logo">
        <Briefcase size={24} color="#2563eb" />
        <h1>JobAggregator</h1>
      </div>

      <nav className="header-nav">
        <button
          className={`nav-item ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => onTabChange('all')}
        >
          Toutes les offres
        </button>
        <button
          className={`nav-item ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => onTabChange('saved')}
        >
          <Heart size={16} /> Favoris
        </button>
        <button
          className={`nav-item ${activeTab === 'applied' ? 'active' : ''}`}
          onClick={() => onTabChange('applied')}
        >
          <CheckCircle size={16} /> Candidatures
        </button>
      </nav>

      <div className="header-actions">
        <button className="theme-toggle" onClick={toggleDarkMode} title="Changer de thème">
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
};

Header.propTypes = {
  darkMode: PropTypes.bool.isRequired,
  toggleDarkMode: PropTypes.func.isRequired,
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
};

export default Header;
