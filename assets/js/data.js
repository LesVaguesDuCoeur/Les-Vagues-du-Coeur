window.AppData = {
  FICTIVE_VOLUNTEERS: [
    { id: 1, name: "Yasmine Aouf", initial: "Y" },
    { id: 2, name: "Lucas Martin", initial: "L" },
    { id: 3, name: "Sofiane Bel.", initial: "S" },
    { id: 4, name: "Kenji Tanaka", initial: "K" }
  ],
  POLES: [
    { id: "admin", name: "Administratif", email: "contact@endfaimsansfil.org", icon: "fa-folder-open" },
    { id: "bureau", name: "Bureau", email: "bureau@enfaimsansfil.org", icon: "fa-gavel" },
    { id: "comm", name: "Communication", email: "communication@endfaimsansfil.org", icon: "fa-bullhorn" },
    { id: "compta", name: "Comptabilité", email: "comptabilite@endfaimsansfil.org", icon: "fa-calculator" },
    { id: "coord", name: "Coordination", email: "coordination@enfaimsansfil.org", icon: "fa-sitemap" },
    { id: "event", name: "Événements", email: "evenement@endfaimsansfil.org", icon: "fa-calendar-alt" },
    { id: "familles", name: "Familles", email: "familles@endfaimsansfil.org", icon: "fa-users" },
    { id: "info", name: "Informatique", email: "informatique@enfaimsansfil.org", icon: "fa-laptop-code" },
    { id: "juridique", name: "Juridique", email: "juridique@enfaimsansfil.org", icon: "fa-balance-scale" },
    { id: "partenaires", name: "Partenaires", email: "partenaires@endfaimsansfil.org", icon: "fa-handshake" },
    { id: "rh", name: "RH", email: "rh@enfaimsansfil.org", icon: "fa-user-tie" }
  ],
  DRIVE: {
    roots: [
      { id: "root-poles", name: "Pôles", type: "folder", icon: "folder", color: "blue", access: "admin", items: "poles" },
      { id: "root-collab", name: "Espace Collaboratif", type: "folder", icon: "folder", color: "yellow", access: "all", items: "collab" },
      { id: "root-volunteers", name: "Espaces Bénévoles", type: "folder", icon: "folder", color: "yellow", access: "all", items: "volunteers" },
      { id: "root-admin", name: "Administration", type: "folder", icon: "folder_lock", color: "red", access: "bureau", items: "admin" }
    ],
    mockItems: {
      comm: [
        { id: "c1", name: "Charte graphique 2026.pdf", type: "pdf", icon: "picture_as_pdf" },
        { id: "c2", name: "Kit communication Noël.zip", type: "archive", icon: "folder_zip" },
        { id: "c3", name: "Post Instagram - Maraude.png", type: "image", icon: "image" },
        { id: "c4", name: "Plan de comm T1.xlsx", type: "sheet", icon: "table" },
        { id: "c5", name: "Logos officiels.zip", type: "archive", icon: "folder_zip" }
      ],
      collab: [
        { id: "co1", name: "CR réunion générale - 2026-04-15.docx", type: "doc", icon: "description" },
        { id: "co2", name: "Planning maraudes avril.xlsx", type: "sheet", icon: "table" },
        { id: "co3", name: "Idées actions été.docx", type: "doc", icon: "description" },
        { id: "co4", name: "Annuaire bénévoles.pdf", type: "pdf", icon: "picture_as_pdf" },
        { id: "co5", name: "Calendrier associatif 2026.xlsx", type: "sheet", icon: "table" },
        { id: "co6", name: "Protocole sanitaire.pdf", type: "pdf", icon: "picture_as_pdf" }
      ],
      admin: [
        { id: "a1", name: "Statuts 2024.pdf", type: "pdf", icon: "picture_as_pdf" },
        { id: "a2", name: "PV AG - 2025-10-12.pdf", type: "pdf", icon: "picture_as_pdf" },
        { id: "a3", name: "Contrat assurance 2026.pdf", type: "pdf", icon: "picture_as_pdf" },
        { id: "a4", name: "Registre adhérents.xlsx", type: "sheet", icon: "table" },
        { id: "a5", name: "Déclaration préfecture.pdf", type: "pdf", icon: "picture_as_pdf" }
      ]
    }
  },
  STEPS: [
    {
      title: "Création des groupes Google",
      duration: "30 min",
      content: "Vérifier les 11 groupes email dans Google Workspace Admin. S'assurer que les bénévoles sont bien membres."
    },
    {
      title: "Création de l'arborescence Drive",
      duration: "20 min",
      content: "Créer les 4 dossiers racines : Pôles, Espace Collaboratif, Espaces Bénévoles, Administration. Dans Pôles : 11 sous-dossiers. Dans Espaces Bénévoles : un sous-dossier par bénévole."
    },
    {
      title: "Configuration des partages",
      duration: "30 min",
      content: "Chaque dossier pôle partagé avec son groupe email en Éditeur. Espace Collaboratif partagé avec tous en Éditeur. Chaque espace bénévole partagé avec le bénévole. Administration restreinte au Bureau."
    },
    {
      title: "Migration des fichiers existants",
      duration: "30-60 min",
      content: "Rapatrier depuis drives personnels, WhatsApp, Trello, Notion. Appel collectif aux bénévoles pour déposer leurs fichiers dans le bon pôle."
    },
    {
      title: "Délégation Gmail",
      duration: "20 min",
      content: "Configurer la délégation d'envoi sur chaque boîte officielle pour les bénévoles concernés."
    },
    {
      title: "Communication & onboarding",
      duration: "15 min",
      content: "Mail global expliquant la nouvelle organisation + mini-guide PDF. Mise à jour du document d'accueil des nouveaux bénévoles."
    }
  ]
};
