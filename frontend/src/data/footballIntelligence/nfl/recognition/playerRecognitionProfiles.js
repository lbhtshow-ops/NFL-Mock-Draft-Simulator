export const playerRecognitionProfiles = {
  "00-0033873": {
    playerName: "Patrick Mahomes",
    awards: [
      { type: "mvp", season: 2018 },
      { type: "firstTeamAllPro", season: 2018 },
      { type: "proBowl", season: 2018 },

      { type: "proBowl", season: 2019 },
      { type: "proBowl", season: 2020 },
      { type: "proBowl", season: 2021 },

      { type: "mvp", season: 2022 },
      { type: "firstTeamAllPro", season: 2022 },
      { type: "proBowl", season: 2022 },

      { type: "proBowl", season: 2023 },
      { type: "proBowl", season: 2024 },
    ],
  },

  "00-0034796": {
    playerName: "Lamar Jackson",
    awards: [
      { type: "mvp", season: 2019 },
      { type: "firstTeamAllPro", season: 2019 },
      { type: "proBowl", season: 2019 },

      { type: "proBowl", season: 2021 },

      { type: "mvp", season: 2023 },
      { type: "firstTeamAllPro", season: 2023 },
      { type: "proBowl", season: 2023 },

      { type: "firstTeamAllPro", season: 2024 },
      { type: "proBowl", season: 2024 },
    ],
  },

  "00-0034857": {
    playerName: "Josh Allen",
    awards: [
      { type: "secondTeamAllPro", season: 2020 },
      { type: "proBowl", season: 2020 },

      { type: "proBowl", season: 2022 },
      { type: "proBowl", season: 2023 },

      { type: "mvp", season: 2024 },
      { type: "proBowl", season: 2024 },
    ],
  },

  "00-0036389": {
    playerName: "Jalen Hurts",
    awards: [
      { type: "secondTeamAllPro", season: 2022 },
      { type: "proBowl", season: 2022 },
      { type: "proBowl", season: 2023 },
    ],
  },
};

export function getPlayerRecognitionProfile(playerId) {
  return playerRecognitionProfiles[playerId] || null;
}

export default playerRecognitionProfiles;