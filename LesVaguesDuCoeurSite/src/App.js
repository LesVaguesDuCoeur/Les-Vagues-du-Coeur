import React, { useState, useEffect } from 'react';
import './App.css';
import {
  saveSubmission,
  getLocalSubmissions,
  deleteLocalSubmission,
  exportSubmissionsAsJSON,
  clearLocalData,
  syncUnsyncedSubmissions,
  getUnsyncedSubmissions
} from './backupService';

function App() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: '',
    message: ''
  });
  const [submissions, setSubmissions] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [unsyncedCount, setUnsyncedCount] = useState(0);

  // Charger les soumissions au démarrage
  useEffect(() => {
    loadSubmissions();
  }, []);

  // Mettre à jour le nombre de soumissions non synchronisées
  useEffect(() => {
    const updateUnsyncedCount = () => {
      const unsynced = getUnsyncedSubmissions();
      setUnsyncedCount(unsynced.length);
    };
    updateUnsyncedCount();
  }, [submissions]);

  const loadSubmissions = () => {
    const localSubmissions = getLocalSubmissions();
    setSubmissions(localSubmissions);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Sauvegarder dans le cloud et localement
    const submission = await saveSubmission(formData);

    if (submission) {
      // Réinitialiser le formulaire
      setFormData({ name: '', email: '', type: '', message: '' });

      // Recharger les soumissions
      loadSubmissions();

      // Afficher un message de succès
      alert('Votre demande a été enregistrée et sauvegardée!');

      // Envoyer à Formspree pour la notification email
      try {
        const formElement = e.target;
        const formDataToSend = new FormData(formElement);
        formDataToSend.set('name', formData.name);
        formDataToSend.set('email', formData.email);
        formDataToSend.set('type', formData.type);
        formDataToSend.set('message', formData.message);

        await fetch('https://formspree.io/f/xoqgqodg', {
          method: 'POST',
          body: formDataToSend,
          headers: {
            'Accept': 'application/json',
          }
        });
      } catch (error) {
        console.error('Erreur lors de l\'envoi à Formspree:', error);
      }
    } else {
      alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
    }
  };

  const handleDeleteSubmission = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette soumission?')) {
      deleteLocalSubmission(id);
      loadSubmissions();
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncUnsyncedSubmissions();
      loadSubmissions();
      alert('Synchronisation terminée!');
    } catch (error) {
      alert('Erreur lors de la synchronisation: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = () => {
    exportSubmissionsAsJSON();
    alert('Les soumissions ont été exportées en JSON');
  };

  const handleClear = () => {
    if (window.confirm('Êtes-vous sûr? Cette action est irréversible!')) {
      clearLocalData();
      setSubmissions([]);
      alert('Toutes les données locales ont été supprimées');
    }
  };

  return (
    <main className="App">
      <h1>Les Vagues du Cœur</h1>
      <p>Nous aidons à la recherche d'emploi, rédaction de C.V., démarches administratives, etc.</p>

      {/* Formulaire */}
      <section className="form-section">
        <h2>Faire une demande</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Nom complet"
            value={formData.name}
            onChange={handleInputChange}
            required
          /><br/>
          <input
            type="email"
            name="email"
            placeholder="Adresse email"
            value={formData.email}
            onChange={handleInputChange}
            required
          /><br/>
          <select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            required
          >
            <option value="">-- Type de demande --</option>
            <option value="emploi">Recherche d'emploi</option>
            <option value="cv">Aide pour CV</option>
            <option value="motivation">Lettre de motivation</option>
            <option value="admin">Démarches administratives</option>
            <option value="autre">Autre</option>
          </select><br/>
          <textarea
            name="message"
            placeholder="Votre message"
            rows="4"
            value={formData.message}
            onChange={handleInputChange}
            required
          ></textarea><br/>
          <button type="submit">Envoyer</button>
        </form>
      </section>

      {/* Section de sauvegarde (collapsible) */}
      <section className="backup-section">
        <button
          className="backup-toggle"
          onClick={() => setShowBackup(!showBackup)}
        >
          {showBackup ? '▼' : '▶'} Gestion des sauvegardes ({submissions.length})
          {unsyncedCount > 0 && (
            <span className="unsynced-badge"> - {unsyncedCount} non synchronisée(s)</span>
          )}
        </button>

        {showBackup && (
          <div className="backup-content">
            <div className="backup-controls">
              <button
                onClick={handleSync}
                disabled={isSyncing || unsyncedCount === 0}
                className="btn-sync"
              >
                {isSyncing ? 'Synchronisation...' : 'Synchroniser avec le cloud'}
              </button>
              <button onClick={handleExport} className="btn-export">
                Exporter en JSON
              </button>
              <button onClick={handleClear} className="btn-clear">
                Effacer toutes les données
              </button>
            </div>

            {submissions.length > 0 ? (
              <div className="submissions-list">
                <h3>Soumissions ({submissions.length})</h3>
                {submissions.map(submission => (
                  <div key={submission.id} className="submission-item">
                    <div className="submission-header">
                      <strong>{submission.name}</strong>
                      <span className={`status ${submission.synced ? 'synced' : 'unsynced'}`}>
                        {submission.synced ? '☁ Synchronisé' : '⚠ Non synchronisé'}
                      </span>
                    </div>
                    <p><small>{submission.email}</small></p>
                    <p><small>Type: {submission.type}</small></p>
                    <p><small>Date: {new Date(submission.timestamp).toLocaleString('fr-FR')}</small></p>
                    <p><small>Message: {submission.message.substring(0, 100)}...</small></p>
                    <button
                      onClick={() => handleDeleteSubmission(submission.id)}
                      className="btn-delete"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-submissions">Aucune soumission pour le moment</p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;