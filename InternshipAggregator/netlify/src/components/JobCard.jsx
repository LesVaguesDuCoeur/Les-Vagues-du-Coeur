import React from 'react';
import PropTypes from 'prop-types';
import { Briefcase, MapPin, Clock, DollarSign, ExternalLink, Copy, Heart, CheckCircle, EyeOff, Calendar } from 'lucide-react';
import './JobCard.css';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const JobCard = ({ job, onSave, onApply, onHide, onCopy }) => {
  const handleCopy = () => {
    const text = `
${job.title} chez ${job.company}
Lieu : ${job.location}
Contrat : ${job.contract}
Salaire : ${job.salary}
Description :
${job.description}

Lien : ${job.url}
    `.trim();
    navigator.clipboard.writeText(text);
    onCopy(job.id);
  };

  const timeAgo = job.date ? formatDistanceToNow(new Date(job.date), { addSuffix: true, locale: fr }) : '';

  return (
    <div className={`job-card ${job.isApplied ? 'applied' : ''} ${job.isSaved ? 'saved' : ''}`}>
      <div className="job-header">
        <div className="job-main-info">
          <h3 className="job-title">{job.title}</h3>
          <div className="job-company">
            <span className="company-name">{job.company}</span>
            {job.source && <span className="job-source">via {job.source}</span>}
          </div>
        </div>
        <div className="job-actions-top">
           <button
             className={`icon-btn ${job.isSaved ? 'active' : ''}`}
             onClick={() => onSave(job)}
             title={job.isSaved ? "Retirer des favoris" : "Sauvegarder"}
           >
             <Heart size={20} fill={job.isSaved ? "currentColor" : "none"} />
           </button>
           <button
             className="icon-btn"
             onClick={() => onHide(job)}
             title="Masquer"
           >
             <EyeOff size={20} />
           </button>
        </div>
      </div>

      <div className="job-details">
        <div className="detail-item">
          <MapPin size={16} /> <span>{job.location}</span>
        </div>
        <div className="detail-item">
          <Briefcase size={16} /> <span>{job.contract}</span>
        </div>
        {job.salary && job.salary !== 'Non communiqué' && (
            <div className="detail-item">
            <DollarSign size={16} /> <span>{job.salary}</span>
            </div>
        )}
        <div className="detail-item">
            <Calendar size={16} /> <span>{timeAgo}</span>
        </div>
      </div>

      <div className="job-tags">
        {job.tags && job.tags.map((tag, idx) => {
          let extraClass = '';
          if (tag === 'Big4') extraClass = 'tag-big4';
          if (tag === 'CAC40') extraClass = 'tag-cac40';
          if (tag === 'Fonction publique') extraClass = 'tag-public';

          return <span key={idx} className={`tag ${extraClass}`}>{tag}</span>;
        })}
         <span className="tag level">{job.studyLevel}</span>
      </div>

      <p className="job-description">
        {job.description}
      </p>

      <div className="job-footer">
        <div className="left-actions">
           <button className={`btn-secondary ${job.isApplied ? 'success' : ''}`} onClick={() => onApply(job)}>
             <CheckCircle size={16} />
             {job.isApplied ? 'Postulé' : 'Marquer comme postulé'}
           </button>
           <button className="btn-secondary" onClick={handleCopy}>
             <Copy size={16} /> Copier
           </button>
        </div>
        <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn-primary">
          Postuler <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
};

JobCard.propTypes = {
  job: PropTypes.object.isRequired,
  onSave: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  onHide: PropTypes.func.isRequired,
  onCopy: PropTypes.func.isRequired,
};

export default JobCard;
