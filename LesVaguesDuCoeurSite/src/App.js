import React from 'react';
import './App.css';

function App() {
  return (
    <main className="App">
      <h1>Les Vagues du Cœur</h1>
      <p>Nous aidons à la recherche d'emploi, rédaction de C.V., démarches administratives, etc.</p>
      <form action="https://formspree.io/f/xoqgqodg" method="POST" encType="multipart/form-data">
        <input type="text" name="name" placeholder="Nom complet" required /><br/>
        <input type="email" name="email" placeholder="Adresse email" required /><br/>
        <select name="type" required>
          <option value="">-- Type de demande --</option>
          <option value="emploi">Recherche d'emploi</option>
          <option value="cv">Aide pour CV</option>
          <option value="motivation">Lettre de motivation</option>
          <option value="admin">Démarches administratives</option>
          <option value="autre">Autre</option>
        </select><br/>
        <textarea name="message" placeholder="Votre message" rows="4" required></textarea><br/>
        <input type="file" name="attachment" /><br/>
        <button type="submit">Envoyer</button>
      </form>
    </main>
  );
}

export default App;