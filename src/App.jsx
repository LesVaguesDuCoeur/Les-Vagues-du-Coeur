import React, { useState, useMemo } from 'react';
import { Layout } from './components/Layout';
import { Catalog } from './components/Catalog';
import { WeekPlanner } from './components/WeekPlanner';
import { generateRecipes } from './data/generator';
import { INITIAL_MENU } from './data/menu';
import { usePersistence } from './hooks/usePersistence';

function App() {
  const [view, setView] = useState('planner');

  // Generate recipes once on mount so IDs stay stable
  const allRecipes = useMemo(() => generateRecipes(), []);

  const { menu, setMenu, saveToCloud, isSaving } = usePersistence(INITIAL_MENU);

  return (
    <Layout view={view} setView={setView} onSave={saveToCloud}>
      {view === 'planner' && (
        <WeekPlanner menu={menu} />
      )}
      {view === 'catalog' && (
        <Catalog recipes={allRecipes} />
      )}
    </Layout>
  );
}

export default App;
