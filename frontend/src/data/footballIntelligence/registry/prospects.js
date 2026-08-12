// src/data/footballIntelligence/registry/prospects.js

import { prospectIds } from "./prospectIds.js";

export const prospects = {
  [prospectIds.ARCH_MANNING]: {
    id: prospectIds.ARCH_MANNING,
    draftClass: 2026,
    name: "Arch Manning",
    position: "QB",
    school: "Texas",
    aliases: {
      simulatorRank: 1,
      simulatorName: "Arch Manning",
      slug: "arch-manning",
    },
  },

  [prospectIds.CALEB_DOWNS]: {
    id: prospectIds.CALEB_DOWNS,
    draftClass: 2026,
    name: "Caleb Downs",
    position: "S",
    school: "Ohio State",
    aliases: {
      simulatorRank: 2,
      simulatorName: "Caleb Downs",
      slug: "caleb-downs",
    },
  },

  [prospectIds.PETER_WOODS]: {
    id: prospectIds.PETER_WOODS,
    draftClass: 2026,
    name: "Peter Woods",
    position: "DL",
    school: "Clemson",
    aliases: {
      simulatorRank: 3,
      simulatorName: "Peter Woods",
      slug: "peter-woods",
    },
  },

  [prospectIds.FRANCIS_MAUIGOA]: {
    id: prospectIds.FRANCIS_MAUIGOA,
    draftClass: 2026,
    name: "Francis Mauigoa",
    position: "OT",
    school: "Miami",
    aliases: {
      simulatorRank: 4,
      simulatorName: "Francis Mauigoa",
      slug: "francis-mauigoa",
    },
  },

  [prospectIds.LANORRIS_SELLERS]: {
    id: prospectIds.LANORRIS_SELLERS,
    draftClass: 2026,
    name: "LaNorris Sellers",
    position: "QB",
    school: "South Carolina",
    aliases: {
      simulatorRank: 5,
      simulatorName: "LaNorris Sellers",
      slug: "lanorris-sellers",
    },
  },

  [prospectIds.KADYN_PROCTOR]: {
    id: prospectIds.KADYN_PROCTOR,
    draftClass: 2026,
    name: "Kadyn Proctor",
    position: "OT",
    school: "Alabama",
    aliases: {
      simulatorRank: 6,
      simulatorName: "Kadyn Proctor",
      slug: "kadyn-proctor",
    },
  },

  [prospectIds.TJ_PARKER]: {
    id: prospectIds.TJ_PARKER,
    draftClass: 2026,
    name: "T.J. Parker",
    position: "EDGE",
    school: "Clemson",
    aliases: {
      simulatorRank: 7,
      simulatorName: "T.J. Parker",
      slug: "tj-parker",
    },
  },

  [prospectIds.RUEBEN_BAIN]: {
    id: prospectIds.RUEBEN_BAIN,
    draftClass: 2026,
    name: "Rueben Bain Jr.",
    position: "EDGE",
    school: "Miami",
    aliases: {
      simulatorRank: 8,
      simulatorName: "Rueben Bain Jr.",
      slug: "rueben-bain-jr",
    },
  },

  [prospectIds.JEREMIYAH_LOVE]: {
    id: prospectIds.JEREMIYAH_LOVE,
    draftClass: 2026,
    name: "Jeremiyah Love",
    position: "RB",
    school: "Notre Dame",
    aliases: {
      simulatorRank: 9,
      simulatorName: "Jeremiyah Love",
      slug: "jeremiyah-love",
    },
  },

  [prospectIds.CALEB_LOMU]: {
    id: prospectIds.CALEB_LOMU,
    draftClass: 2026,
    name: "Caleb Lomu",
    position: "OT",
    school: "Utah",
    aliases: {
      simulatorRank: 10,
      simulatorName: "Caleb Lomu",
      slug: "caleb-lomu",
    },
  },
};

function normalizeName(name = "") {
  return String(name)
    .toLowerCase()
    .replaceAll(".", "")
    .replaceAll("'", "")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getProspectById(prospectId) {
  if (!prospectId) return null;

  return prospects[prospectId] || null;
}

export function getProspectByName(name) {
  if (!name) return null;

  const normalizedInput = normalizeName(name);

  return (
    Object.values(prospects).find((prospect) => {
      const candidateNames = [
        prospect.name,
        prospect.aliases?.simulatorName,
        prospect.aliases?.slug,
      ].filter(Boolean);

      return candidateNames.some(
        (candidateName) =>
          normalizeName(candidateName) === normalizedInput
      );
    }) || null
  );
}

export function getProspectByRank(rank) {
  if (rank === null || rank === undefined) {
    return null;
  }

  const normalizedRank = Number(rank);

  return (
    Object.values(prospects).find(
      (prospect) =>
        Number(prospect.aliases?.simulatorRank) === normalizedRank
    ) || null
  );
}

export default prospects;