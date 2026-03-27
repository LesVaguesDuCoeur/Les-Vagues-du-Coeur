import React from 'react';
import PropTypes from 'prop-types';
import { Search, MapPin, Briefcase, GraduationCap, Filter } from 'lucide-react';
import './FilterSidebar.css';

const FilterSidebar = ({ filters, onFilterChange, excludeSchools, onToggleSchools }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  return (
    <div className="filter-sidebar">
      <div className="filter-header">
        <h3><Filter size={18} /> Filtres</h3>
      </div>

      <div className="filter-group">
        <label>Recherche</label>
        <div className="input-with-icon">
          <Search size={16} />
          <input
            type="text"
            name="search"
            placeholder="Titre, entreprise..."
            value={filters.search || ''}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="filter-group">
        <label>Contrat</label>
        <div className="input-with-icon">
          <Briefcase size={16} />
          <select name="contract" value={filters.contract} onChange={handleChange}>
            <option value="Tous">Tous</option>
            <option value="Alternance">Alternance</option>
            <option value="Stage">Stage</option>
            <option value="CDI">CDI</option>
            <option value="CDD">CDD</option>
          </select>
        </div>
      </div>

      <div className="filter-group">
        <label>Catégorie</label>
        <select name="category" value={filters.category} onChange={handleChange}>
          <option value="Toutes">Toutes</option>
          <option value="Comptabilité">Comptabilité</option>
          <option value="Finance">Finance</option>
          <option value="Audit">Audit</option>
          <option value="Contrôle de gestion">Contrôle de gestion</option>
          <option value="Fiscalité">Fiscalité</option>
          <option value="Paie/RH">Paie/RH</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Localisation</label>
        <div className="input-with-icon">
          <MapPin size={16} />
          <input
            type="text"
            name="location"
            placeholder="Ville..."
            value={filters.location}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="filter-group">
        <label>Niveau d'études</label>
        <div className="input-with-icon">
          <GraduationCap size={16} />
          <select name="studyLevel" value={filters.studyLevel} onChange={handleChange}>
            <option value="Tous">Tous</option>
            <option value="Bac+2">Bac+2</option>
            <option value="Bac+3">Bac+3</option>
            <option value="Bac+4">Bac+4</option>
            <option value="Bac+5">Bac+5</option>
          </select>
        </div>
      </div>

      <div className="filter-group toggle-group">
        <label className="toggle-label">
          <span>Masquer les écoles</span>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={excludeSchools}
              onChange={(e) => onToggleSchools(e.target.checked)}
            />
            <span className="slider round"></span>
          </div>
        </label>
        <p className="filter-hint">Masque les offres de formation (ISCOD, Studi...)</p>
      </div>
    </div>
  );
};

FilterSidebar.propTypes = {
  filters: PropTypes.object.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  excludeSchools: PropTypes.bool.isRequired,
  onToggleSchools: PropTypes.func.isRequired,
};

export default FilterSidebar;
