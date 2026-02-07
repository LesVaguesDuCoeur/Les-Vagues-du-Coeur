// Database of Champions
window.CHAMPIONS_DB = [
    {
        id: "doctor_doom",
        name: "Doctor Doom",
        class: "mystic",
        tags: ["#villain", "#control", "#metal", "#shock_immune", "#incinerate_immune"],
        tier_offense: "God",
        tier_defense: "God",
        abilities_summary: "Contrôle de pouvoir, nullify, imblocable, gros dégâts SP2.",
        released: "2019"
    },
    {
        id: "hercules",
        name: "Hercules",
        class: "cosmic",
        tags: ["#hero", "#god", "#immortal", "#burst_damage"],
        tier_offense: "Beyond God",
        tier_defense: "A",
        abilities_summary: "Immortalité, dégâts massifs, intercept facile.",
        released: "2021"
    },
    {
        id: "ghost",
        name: "Ghost",
        class: "tech",
        tags: ["#villain", "#mercenary", "#phasing", "#dot_immune"],
        tier_offense: "God",
        tier_defense: "B",
        abilities_summary: "Intouchable (phase), convertit les debuffs en furies, coups critiques garantis.",
        released: "2018"
    },
    {
        id: "human_torch",
        name: "Human Torch",
        class: "science",
        tags: ["#hero", "#fantastic_four", "#incinerate_immune", "#pre_fight"],
        tier_offense: "God",
        tier_defense: "B",
        abilities_summary: "Fait fondre les mystiques, incinération/nova flame, inverse la régénération.",
        released: "2019"
    },
    {
        id: "nick_fury",
        name: "Nick Fury",
        class: "skill",
        tags: ["#hero", "#shield", "#avenger", "#leader"],
        tier_offense: "God",
        tier_defense: "A",
        abilities_summary: "Seconde vie (LMD), saignements massifs, anti-evade, anti-auto block.",
        released: "2019"
    },
    {
        id: "magneto",
        name: "Magneto (Red)",
        class: "mutant",
        tags: ["#villain", "#metal_control", "#leader"],
        tier_offense: "God",
        tier_defense: "B",
        abilities_summary: "Détruit les champions #Metal. AAR (Ability Accuracy Reduction) massif.",
        released: "2015"
    },
    {
        id: "kitty_pryde",
        name: "Kitty Pryde",
        class: "mutant",
        tags: ["#hero", "#xmen", "#phasing", "#incinerate_immune"],
        tier_offense: "Beyond God",
        tier_defense: "A",
        abilities_summary: "Phase sans prendre de dégâts, immunités via phase, boostée par Tigra.",
        released: "2021"
    },
    {
        id: "nimrod",
        name: "Nimrod",
        class: "tech",
        tags: ["#villain", "#robot", "#sentinel", "#mutant_hunter"],
        tier_offense: "God",
        tier_defense: "God",
        abilities_summary: "Chasseur de mutants, convertit prouesses/regen en chocs.",
        released: "2021"
    },
    {
        id: "shang_chi",
        name: "Shang-Chi",
        class: "skill",
        tags: ["#hero", "#avenger", "#martial_artist", "#cleanse"],
        tier_offense: "God",
        tier_defense: "C",
        abilities_summary: "Utility infinie via Wushu Strikes : imblocable, cleanse, stun, slow.",
        released: "2021"
    },
    {
        id: "cgr",
        name: "Cosmic Ghost Rider",
        class: "cosmic",
        tags: ["#villain", "#herald", "#armor_break", "#incinerate_immune", "#bleed_immune"],
        tier_offense: "Beyond God",
        tier_defense: "C",
        abilities_summary: "Dégâts nucléaires rapides, power gain, armor breaks.",
        released: "2020"
    },
    {
        id: "apocalypse",
        name: "Apocalypse",
        class: "mutant",
        tags: ["#villain", "#horseman", "#large", "#purify"],
        tier_offense: "God",
        tier_defense: "God",
        abilities_summary: "Booste les mutants (Horseman), immunité étourdissement/saignement évolutive.",
        released: "2020"
    },
    {
        id: "archangel",
        name: "Archangel",
        class: "mutant",
        tags: ["#villain", "#xmen", "#neurotoxin", "#dot"],
        tier_offense: "God",
        tier_defense: "C",
        abilities_summary: "Neurotoxines qui bloquent la régénération et réduisent la précision de compétence.",
        released: "2017"
    },
    {
        id: "tigra",
        name: "Tigra",
        class: "mystic",
        tags: ["#hero", "#avenger", "#neutralize", "#miss"],
        tier_offense: "God",
        tier_defense: "B",
        abilities_summary: "Gameplay high skill (miss), neutralise les buffs, dégâts de rupture.",
        released: "2020"
    },
    {
        id: "scorpion",
        name: "Scorpion",
        class: "science",
        tags: ["#villain", "#sinister_six", "#poison_immune", "#shock_immune"],
        tier_offense: "God",
        tier_defense: "God",
        abilities_summary: "Choisit son immunité/debuff (poison/incinération/choc), bloque la régénération.",
        released: "2022"
    },
    {
        id: "spot",
        name: "Spot",
        class: "science",
        tags: ["#villain", "#spider_verse", "#dimension"],
        tier_offense: "God",
        tier_defense: "God",
        abilities_summary: "Dégâts de rupture massifs, intouchable en phase portail.",
        released: "2022"
    },
    {
        id: "kingpin",
        name: "Kingpin",
        class: "skill",
        tags: ["#villain", "#crime_boss", "#large", "#purify"],
        tier_offense: "God",
        tier_defense: "A",
        abilities_summary: "Purifie les debuffs en rage, tanky, dégâts physiques énormes.",
        released: "2017"
    },
    {
        id: "valkyrie",
        name: "Valkyrie",
        class: "skill",
        tags: ["#hero", "#asgardian", "#pierce"],
        tier_offense: "God",
        tier_defense: "C",
        abilities_summary: "Ignore l'imblocable et l'armure, frappe dans la garde.",
        released: "2022"
    },
    {
        id: "galan",
        name: "Galan",
        class: "cosmic",
        tags: ["#villain", "#herald", "#planetary", "#harvest"],
        tier_offense: "Beyond God",
        tier_defense: "A",
        abilities_summary: "Dégâts directs (Harvest) qui ignorent tout, immunité nullify.",
        released: "2022"
    },
    {
        id: "hulkling",
        name: "Hulkling",
        class: "cosmic",
        tags: ["#hero", "#young_avenger", "#hybrid", "#pierce_immune"],
        tier_offense: "God",
        tier_defense: "God",
        abilities_summary: "Indestructible, imblocable, gros dégâts, immunité power drain/burn.",
        released: "2022"
    },
    {
        id: "abs_man",
        name: "Absorbing Man",
        class: "mystic",
        tags: ["#villain", "#gamma", "#morph"],
        tier_offense: "God",
        tier_defense: "God",
        abilities_summary: "Formes Magma/Uru, immunités spécifiques, grosse régénération.",
        released: "2023"
    },
    {
        id: "warlock",
        name: "Warlock",
        class: "tech",
        tags: ["#hero", "#robot", "#new_mutant", "#infection"],
        tier_offense: "God",
        tier_defense: "A",
        abilities_summary: "Infection (bloque régénération/pouvoir), immunité totale aux DOT (sauf rupture).",
        released: "2019"
    },
    {
        id: "idoom",
        name: "Infamous Iron Man",
        class: "tech",
        tags: ["#villain", "#metal", "#armor", "#shock"],
        tier_offense: "God",
        tier_defense: "A",
        abilities_summary: "Gameplay style Doom mais Tech. Punit les prouesses, tanky.",
        released: "2022"
    },
    {
        id: "titania",
        name: "Titania",
        class: "science",
        tags: ["#villain", "#gamma", "#large", "#debuff_immune"],
        tier_offense: "God",
        tier_defense: "B",
        abilities_summary: "Immunité aux debuffs (Haymaker), indestrutible, gros dégâts.",
        released: "2022"
    },
    {
        id: "quicksilver",
        name: "Quicksilver",
        class: "science",
        tags: ["#hero", "#speedster", "#avenger", "#evade"],
        tier_offense: "God",
        tier_defense: "B",
        abilities_summary: "Vitesse extrême, whiplash (dégâts retardés), momentum.",
        released: "2022"
    },
    {
        id: "kate_bishop",
        name: "Kate Bishop",
        class: "skill",
        tags: ["#hero", "#young_avenger", "#archer", "#cold_snap", "#tranquilize"],
        tier_offense: "Beyond God",
        tier_defense: "C",
        abilities_summary: "Flèches utilitaires (Cold Snap, Coldsnap, Tranquilize), dégâts parfaits.",
        released: "2023"
    }
];

// Helper to find a champion by ID
function getChampionById(id) {
    return CHAMPIONS_DB.find(c => c.id === id);
}

// Helper to filter champions
function filterChampions(filters = {}) {
    return CHAMPIONS_DB.filter(c => {
        if (filters.class && filters.class !== 'all' && c.class !== filters.class) return false;
        if (filters.search && !c.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
        return true;
    });
}
