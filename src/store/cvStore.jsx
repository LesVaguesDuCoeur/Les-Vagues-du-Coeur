import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { saveToCloud as apiSaveToCloud } from '../utils/cloudStorage';

const CVContext = createContext();

const initialState = {
  personalInfo: {
    firstName: "Lyes",
    lastName: "LANGOUËT",
    phone: "06 84 10 69 67",
    email: "lyeslangouet@icloud.com",
    linkedin: "linkedin.com/in/lyesl",
    city: "Toulouse, France",
    photo: null,
    tagline: "Titulaire du DCG et futur étudiant en DSCG, je recherche une alternance de deux ans en Comptabilité pour la rentrée 2026."
  },
  experiences: [
    {
      id: "1",
      title: "Comptable",
      company: "Association En Faim Sans Fil",
      city: "Toulouse",
      startDate: "Sept. 2025",
      endDate: "Aujourd'hui",
      description: "Gestion des heures bénévoles (CEC), automatisation de fichiers Excel, gestion financière des achats et suivi des coûts."
    },
    {
      id: "2",
      title: "Assistant comptable",
      company: "Société Alarme Distribution Système",
      city: "Toulouse",
      startDate: "Juil. 2022",
      endDate: "Août 2022",
      description: "Opérations courantes, traitement des factures, gestion des immobilisations, tableaux de bord et automatisation Excel."
    },
    {
      id: "3",
      title: "Mini-Entrepreneur",
      company: "GoBento",
      city: "Toulouse",
      startDate: "Sept. 2021",
      endDate: "Juil. 2022",
      description: "Responsable comptable et commercial : saisie des opérations courantes, gestion clients/fournisseurs, suivi sur Excel et Access."
    },
    {
      id: "4",
      title: "Agent d'accueil & gestionnaire de site",
      company: "DGFiP Occitanie",
      city: "Toulouse",
      startDate: "Déc. 2021",
      endDate: "Janv. 2022",
      description: "Accueil physique et téléphonique, relation contribuable, gestion du courrier, mise à jour des procédures internes."
    },
    {
      id: "5",
      title: "Assistant comptable",
      company: "Cabinet Alta",
      city: "Toulouse",
      startDate: "Nov. 2021",
      endDate: "Nov. 2021",
      description: "Gestion portefeuille client, déclarations TVA, saisie via IBICS, contrôles, rapprochements bancaires et lettrage."
    },
    {
      id: "6",
      title: "Assistant RH Paie & Contrôleur",
      company: "Conseil départemental 31",
      city: "Toulouse",
      startDate: "Mai 2021",
      endDate: "Juin 2021",
      description: "Simulation paie, DPAE à l'URSSAF, saisie RIB vacataires, organigramme, assistant entretien d'embauche."
    },
    {
      id: "7",
      title: "Assistant Comptable & administratif",
      company: "Conseil départemental 31",
      city: "Toulouse",
      startDate: "Mai 2018",
      endDate: "Juil. 2018",
      description: "Gestion et enregistrement des factures, préparation du pré-mandatement dans Astre et transmission à la DFD."
    }
  ],
  skills: [
    {
      id: "s1",
      category: "Logiciels & ERP",
      items: [
        { id: "si1", name: "Astre, Chorus (comptabilité publique)" },
        { id: "si2", name: "Sage, Cegid Quadra, IBICS" },
        { id: "si3", name: "Excel avancé (TCD, macros, VBA)" },
        { id: "si4", name: "SQL, Access, Suite Office" }
      ]
    },
    {
      id: "s2",
      category: "Comptabilité & Gestion",
      items: [
        { id: "si5", name: "Comptabilité publique et privée" },
        { id: "si6", name: "Déclarations fiscales (TVA, IS)" },
        { id: "si7", name: "Contrôle de gestion, tableaux de bord" },
        { id: "si8", name: "Paie et charges sociales" }
      ]
    }
  ],
  education: [
    {
      id: "e1",
      degree: "DSCG",
      school: "TBS Education",
      city: "Toulouse",
      dates: "2026 – 2028"
    },
    {
      id: "e2",
      degree: "DCG",
      school: "Lycée Honoré d'Estienne d'Orves",
      city: "Nice",
      dates: "2022 – 2025"
    },
    {
      id: "e3",
      degree: "BTS Comptabilité Gestion",
      school: "Lycée Ozenne",
      city: "Toulouse",
      dates: "2019 – 2022"
    }
  ],
  languages: [
    { id: "l1", name: "Français", level: "Langue maternelle" },
    { id: "l2", name: "Anglais", level: "Niveau intermédiaire" }
  ],
  interests: [
    { id: "i1", name: "Natation" },
    { id: "i2", name: "Ski" },
    { id: "i3", name: "Entrepreneuriat (création GoBento en 2021)" }
  ]
};

const cvReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FULL_STATE':
      return { ...action.payload };
    case 'UPDATE_PERSONAL_INFO':
      return { ...state, personalInfo: { ...state.personalInfo, ...action.payload } };
    case 'UPDATE_SECTION':
      // payload: { section: 'experiences', data: [...] }
      return { ...state, [action.payload.section]: action.payload.data };
    default:
      return state;
  }
};

export const CVProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cvReducer, initialState, (initial) => {
    // Load from LocalStorage
    try {
      const stored = localStorage.getItem('cvData');
      return stored ? JSON.parse(stored) : initial;
    } catch (e) {
      console.error("Failed to load from LocalStorage", e);
      return initial;
    }
  });

  // Save to LocalStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('cvData', JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save to LocalStorage", e);
    }
  }, [state]);

  const updatePersonalInfo = (data) => {
    dispatch({ type: 'UPDATE_PERSONAL_INFO', payload: data });
  };

  const updateSection = (section, data) => {
    dispatch({ type: 'UPDATE_SECTION', payload: { section, data } });
  };

  const resetData = () => {
    dispatch({ type: 'SET_FULL_STATE', payload: initialState });
  };

  const saveToCloud = async () => {
    return await apiSaveToCloud(state);
  };

  return (
    <CVContext.Provider value={{ state, updatePersonalInfo, updateSection, resetData, saveToCloud }}>
      {children}
    </CVContext.Provider>
  );
};

export const useCV = () => useContext(CVContext);
