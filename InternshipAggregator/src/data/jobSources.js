// Configuration des sources d'offres d'emploi
export const JOB_SOURCES = {
  jobteaser: {
    id: 'jobteaser',
    name: 'JobTeaser',
    logo: 'https://www.jobteaser.com/favicon.ico',
    color: '#FF6B35',
    baseUrl: 'https://www.jobteaser.com/fr/job-offers',
    searchUrl: (params) => {
      const base = 'https://www.jobteaser.com/fr/job-offers?';
      const queryParams = new URLSearchParams({
        contract: 'alternating',
        sort: 'recency',
        utm_source: 'aggregator'
      });
      if (params.sectors) params.sectors.forEach(s => queryParams.append('company_sectors', s));
      if (params.startDates) params.startDates.forEach(d => queryParams.append('start_date', d));
      if (params.studyLevels) params.studyLevels.forEach(l => queryParams.append('study_levels', l));
      return base + queryParams.toString();
    },
    defaultParams: {
      sectors: ['accounting_services', 'audit', 'banking', 'finance'],
      startDates: ['2026_09', '2026_10', '2026_11'],
      studyLevels: ['3', '4', '5']
    }
  },
  welcometothejungle: {
    id: 'welcometothejungle',
    name: 'Welcome to the Jungle',
    logo: 'https://www.welcometothejungle.com/favicon.ico',
    color: '#FFCD00',
    baseUrl: 'https://www.welcometothejungle.com/fr/jobs',
    searchUrl: (params) => {
      const base = 'https://www.welcometothejungle.com/fr/jobs?';
      const queryParams = new URLSearchParams({
        'refinementList[contract_type][]': 'apprenticeship',
        'refinementList[experience_level_minimum][]': '0-1',
        page: '1',
        aroundQuery: params.location || 'Paris',
        searchTitle: 'false',
        sortBy: 'mostRecent'
      });
      if (params.query) queryParams.set('query', params.query);
      return base + queryParams.toString();
    },
    defaultParams: {
      query: 'Comptable',
      location: 'Paris'
    }
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    logo: 'https://www.linkedin.com/favicon.ico',
    color: '#0A66C2',
    baseUrl: 'https://www.linkedin.com/jobs/search/',
    searchUrl: (params) => {
      const base = 'https://www.linkedin.com/jobs/search/?';
      const queryParams = new URLSearchParams({
        f_AL: 'true', // Alternance
        f_E: '1,2', // Entry level + Associate
        sortBy: 'DD', // Date
        location: params.location || 'Paris, Île-de-France, France'
      });
      if (params.keywords) queryParams.set('keywords', params.keywords);
      return base + queryParams.toString();
    },
    defaultParams: {
      keywords: 'comptable alternance DSCG',
      location: 'Paris, Île-de-France, France'
    }
  },
  indeed: {
    id: 'indeed',
    name: 'Indeed',
    logo: 'https://www.indeed.com/favicon.ico',
    color: '#2164F3',
    baseUrl: 'https://www.indeed.fr/jobs',
    searchUrl: (params) => {
      const base = 'https://www.indeed.fr/jobs?';
      const queryParams = new URLSearchParams({
        q: params.query || 'comptable alternance',
        l: params.location || 'Paris (75)',
        sort: 'date',
        jt: 'apprenticeship'
      });
      return base + queryParams.toString();
    },
    defaultParams: {
      query: 'comptable alternance DSCG',
      location: 'Paris (75)'
    }
  },
  hellowork: {
    id: 'hellowork',
    name: 'HelloWork',
    logo: 'https://www.hellowork.com/favicon.ico',
    color: '#00B4D8',
    baseUrl: 'https://www.hellowork.com/fr-fr/emploi/recherche.html',
    searchUrl: (params) => {
      const base = 'https://www.hellowork.com/fr-fr/emploi/recherche.html?';
      const queryParams = new URLSearchParams({
        k: params.query || 'comptable',
        l: params.location || 'Paris',
        c: 'Alternance',
        d: 'all',
        ray: '30'
      });
      return base + queryParams.toString();
    },
    defaultParams: {
      query: 'comptable alternance',
      location: 'Paris'
    }
  },
  francetravail: {
    id: 'francetravail',
    name: 'France Travail',
    logo: 'https://www.francetravail.fr/favicon.ico',
    color: '#003DA5',
    baseUrl: 'https://candidat.francetravail.fr/offres/recherche',
    searchUrl: (params) => {
      const base = 'https://candidat.francetravail.fr/offres/recherche?';
      const queryParams = new URLSearchParams({
        motsCles: params.query || 'comptable',
        typeContrat: 'E2', // Alternance
        tri: '1', // Date
        lieux: params.locationCode || '75D' // Paris
      });
      return base + queryParams.toString();
    },
    defaultParams: {
      query: 'comptable',
      locationCode: '75D'
    }
  },
  apec: {
    id: 'apec',
    name: 'APEC',
    logo: 'https://www.apec.fr/favicon.ico',
    color: '#E30613',
    baseUrl: 'https://www.apec.fr/candidat/recherche-emploi.html/emploi',
    searchUrl: (params) => {
      const base = 'https://www.apec.fr/candidat/recherche-emploi.html/emploi?';
      const queryParams = new URLSearchParams({
        motsCles: params.query || 'comptable',
        typeContrat: '143709', // Alternance code
        tri: 'DATE',
        lieux: '75'
      });
      return base + queryParams.toString();
    },
    defaultParams: {
      query: 'comptable alternance'
    }
  },
  emploipublic: {
    id: 'emploipublic',
    name: 'Emploi Public',
    logo: 'https://www.emploi-public.fr/favicon.ico',
    color: '#1E3A5F',
    baseUrl: 'https://www.emploi-public.fr/recherche-offre-emploi',
    searchUrl: (params) => {
      const base = 'https://www.emploi-public.fr/recherche-offre-emploi?';
      const queryParams = new URLSearchParams({
        motsCles: params.query || 'comptable',
        typeContrat: 'apprentissage',
        tri: 'date'
      });
      return base + queryParams.toString();
    },
    defaultParams: {
      query: 'comptable gestionnaire'
    }
  },
  placedelemploi: {
    id: 'placedelemploi',
    name: 'Place de l\'Emploi Public',
    logo: 'https://place-emploi-public.gouv.fr/favicon.ico',
    color: '#000091',
    baseUrl: 'https://place-emploi-public.gouv.fr/',
    searchUrl: (params) => {
      return `https://place-emploi-public.gouv.fr/offre-emploi/?motsCles=${encodeURIComponent(params.query || 'comptable')}&typeRecrutement=Apprentissage`;
    },
    defaultParams: {
      query: 'comptable'
    }
  },
  labonneBoite: {
    id: 'labonneboite',
    name: 'La Bonne Boîte',
    logo: 'https://labonneboite.francetravail.fr/favicon.ico',
    color: '#8B5CF6',
    baseUrl: 'https://labonneboite.francetravail.fr/',
    searchUrl: (params) => {
      return `https://labonneboite.francetravail.fr/entreprises?j=${encodeURIComponent(params.job || 'comptable')}&l=${encodeURIComponent(params.location || 'Paris')}&d=30`;
    },
    defaultParams: {
      job: 'comptable',
      location: 'Paris'
    }
  },
  cadremploi: {
    id: 'cadremploi',
    name: 'Cadremploi',
    logo: 'https://www.cadremploi.fr/favicon.ico',
    color: '#FF5722',
    baseUrl: 'https://www.cadremploi.fr/emploi/liste_offres',
    searchUrl: (params) => {
      const base = 'https://www.cadremploi.fr/emploi/liste_offres?';
      const queryParams = new URLSearchParams({
        motscles: params.query || 'comptable alternance',
        lieu: params.location || 'paris',
        typecontrat: 'alternance',
        tri: 'DATE'
      });
      return base + queryParams.toString();
    },
    defaultParams: {
      query: 'comptable',
      location: 'paris'
    }
  },
  monster: {
    id: 'monster',
    name: 'Monster',
    logo: 'https://www.monster.fr/favicon.ico',
    color: '#6D28D9',
    baseUrl: 'https://www.monster.fr/emploi/recherche/',
    searchUrl: (params) => {
      const base = 'https://www.monster.fr/emploi/recherche/?';
      const queryParams = new URLSearchParams({
        q: params.query || 'comptable alternance',
        where: params.location || 'Paris',
        et: 'alternance'
      });
      return base + queryParams.toString();
    },
    defaultParams: {
      query: 'comptable alternance',
      location: 'Paris'
    }
  },
  glassdoor: {
    id: 'glassdoor',
    name: 'Glassdoor',
    logo: 'https://www.glassdoor.fr/favicon.ico',
    color: '#0CAA41',
    baseUrl: 'https://www.glassdoor.fr/Emploi/',
    searchUrl: (params) => {
      return `https://www.glassdoor.fr/Emploi/paris-comptable-alternance-emplois-SRCH_IL.0,5_IC2881970_KO6,27.htm?sortBy=date_desc`;
    },
    defaultParams: {}
  },
  regionjob: {
    id: 'regionjob',
    name: 'RegionsJob',
    logo: 'https://www.regionsjob.com/favicon.ico',
    color: '#00A8E8',
    baseUrl: 'https://www.regionsjob.com/emploi/',
    searchUrl: (params) => {
      const base = 'https://www.regionsjob.com/emploi/recherche?';
      const queryParams = new URLSearchParams({
        q: params.query || 'comptable alternance',
        l: params.location || 'Paris',
        c: 'alternance'
      });
      return base + queryParams.toString();
    },
    defaultParams: {
      query: 'comptable alternance',
      location: 'Paris'
    }
  },
  meteojob: {
    id: 'meteojob',
    name: 'Météojob',
    logo: 'https://www.meteojob.com/favicon.ico',
    color: '#FF8C00',
    baseUrl: 'https://www.meteojob.com/jobsearch/',
    searchUrl: (params) => {
      const base = 'https://www.meteojob.com/jobsearch/offers?';
      const queryParams = new URLSearchParams({
        q: params.query || 'comptable alternance',
        l: params.location || 'Paris',
        ct: 'alternance'
      });
      return base + queryParams.toString();
    },
    defaultParams: {
      query: 'comptable',
      location: 'Paris'
    }
  }
};

// Mots-clés pour identifier les écoles/fausses offres
export const SCHOOL_BLACKLIST = [
  'école', 'ecole', 'formation', 'campus', 'académie', 'academie',
  'institut de formation', 'centre de formation', 'cfa ',
  'bachelor', 'mastère', 'mastere', 'mba ',
  'iscod', 'studi', 'openclassrooms', 'icademie', 'aftec',
  'sup de vente', 'école de commerce', 'business school',
  'alternance.fr', 'groupe igs', 'pigier', 'ieseg',
  'emlyon', 'escp', 'kedge', 'neoma', 'skema',
  'ipag', 'inseec', 'idrac', 'esc ', 'ascencia',
  'efab', 'essca', 'iscom', 'isefac', 'esg ',
  'sup career', 'supcareer', 'nextadvance', 'next advance',
  'école supérieure', 'ecole superieure', 'ifocop',
  'enaco', 'comnicia', 'comptalia', 'educatel',
  'rejoins notre formation', 'intègre notre école',
  'forme toi', 'formez-vous', 'devenez comptable',
  'formation gratuite', 'formation rémunérée',
  'pas d\'entreprise', 'recherche entreprise',
  'nous recherchons une entreprise', 'aide à trouver',
  'placement en entreprise', 'accompagnement placement'
];

// Catégories de recherche
export const JOB_CATEGORIES = {
  comptabilite: {
    id: 'comptabilite',
    name: 'Comptabilité',
    icon: '📊',
    keywords: ['comptable', 'comptabilité', 'comptabilite', 'accounting', 'comptes']
  },
  audit: {
    id: 'audit',
    name: 'Audit',
    icon: '🔍',
    keywords: ['audit', 'auditeur', 'auditrice', 'révision', 'commissariat']
  },
  finance: {
    id: 'finance',
    name: 'Finance',
    icon: '💰',
    keywords: ['finance', 'financier', 'financière', 'trésorerie', 'trésorier']
  },
  controleGestion: {
    id: 'controleGestion',
    name: 'Contrôle de Gestion',
    icon: '📈',
    keywords: ['contrôle de gestion', 'controle de gestion', 'contrôleur de gestion', 'controller', 'reporting']
  },
  fiscalite: {
    id: 'fiscalite',
    name: 'Fiscalité',
    icon: '📋',
    keywords: ['fiscal', 'fiscalité', 'fiscaliste', 'tax', 'impôts']
  },
  paie: {
    id: 'paie',
    name: 'Paie / RH',
    icon: '💵',
    keywords: ['paie', 'paye', 'gestionnaire paie', 'rh', 'ressources humaines', 'social']
  },
  gestionAdmin: {
    id: 'gestionAdmin',
    name: 'Gestion Administrative',
    icon: '📁',
    keywords: ['administratif', 'gestion administrative', 'assistant', 'secrétaire']
  }
};

// Types de contrats
export const CONTRACT_TYPES = {
  alternance: { id: 'alternance', name: 'Alternance (Apprentissage/Pro)', icon: '🎓' },
  stage: { id: 'stage', name: 'Stage', icon: '📝' },
  cdi: { id: 'cdi', name: 'CDI', icon: '✅' },
  cdd: { id: 'cdd', name: 'CDD', icon: '📅' },
  interim: { id: 'interim', name: 'Intérim', icon: '⏰' },
  freelance: { id: 'freelance', name: 'Freelance', icon: '💼' }
};

// Localisations principales
export const LOCATIONS = [
  { id: 'paris', name: 'Paris', region: 'Île-de-France' },
  { id: 'idf', name: 'Île-de-France', region: 'Île-de-France' },
  { id: 'lyon', name: 'Lyon', region: 'Auvergne-Rhône-Alpes' },
  { id: 'marseille', name: 'Marseille', region: 'PACA' },
  { id: 'toulouse', name: 'Toulouse', region: 'Occitanie' },
  { id: 'bordeaux', name: 'Bordeaux', region: 'Nouvelle-Aquitaine' },
  { id: 'nantes', name: 'Nantes', region: 'Pays de la Loire' },
  { id: 'lille', name: 'Lille', region: 'Hauts-de-France' },
  { id: 'nice', name: 'Nice', region: 'PACA' },
  { id: 'strasbourg', name: 'Strasbourg', region: 'Grand Est' },
  { id: 'remote', name: 'Télétravail / Remote', region: 'France' },
  { id: 'france', name: 'France entière', region: 'France' }
];

export default JOB_SOURCES;
