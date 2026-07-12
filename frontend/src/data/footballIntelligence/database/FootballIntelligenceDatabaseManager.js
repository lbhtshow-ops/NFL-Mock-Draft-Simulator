// src/data/footballIntelligence/database/FootballIntelligenceDatabaseManager.js

import {
  getFootballPlayerRecord,
  defaultFootballPlayerRecord,
} from "./index";

export function getFootballPlayer(playerId) {
  if (!playerId) return defaultFootballPlayerRecord;

  return getFootballPlayerRecord(playerId) || defaultFootballPlayerRecord;
}

export function hasFootballPlayerRecord(playerId) {
  return Boolean(getFootballPlayerRecord(playerId));
}

export function getFootballPlayerIdentity(playerId) {
  return getFootballPlayer(playerId).identity;
}

export function getFootballPlayerCareerContext(playerId) {
  return getFootballPlayer(playerId).careerContext;
}

export function getFootballPlayerRankings(playerId) {
  return getFootballPlayer(playerId).rankings;
}

export function getFootballPlayerIntelligence(playerId) {
  return getFootballPlayer(playerId).intelligence;
}

export function getFootballPlayerAnalytics(playerId) {
  return getFootballPlayer(playerId).analytics;
}

export function getFootballPlayerScouting(playerId) {
  return getFootballPlayer(playerId).scouting;
}

export function getFootballPlayerCharacter(playerId) {
  return getFootballPlayer(playerId).character;
}

export function getFootballPlayerMedical(playerId) {
  return getFootballPlayer(playerId).medical;
}

export function getFootballPlayerResearch(playerId) {
  return getFootballPlayer(playerId).research;
}

export function getFootballPlayerMetadata(playerId) {
  return getFootballPlayer(playerId).metadata;
}

export function getFootballPlayerDossier(playerId) {
  const player = getFootballPlayer(playerId);

  return {
    playerId: player.playerId,
    identity: player.identity,
    careerContext: player.careerContext,
    rankings: player.rankings,
    intelligence: player.intelligence,
    analytics: player.analytics,
    scouting: player.scouting,
    character: player.character,
    medical: player.medical,
    research: player.research,
    metadata: player.metadata,
  };
}

export default {
  getFootballPlayer,
  hasFootballPlayerRecord,
  getFootballPlayerIdentity,
  getFootballPlayerCareerContext,
  getFootballPlayerRankings,
  getFootballPlayerIntelligence,
  getFootballPlayerAnalytics,
  getFootballPlayerScouting,
  getFootballPlayerCharacter,
  getFootballPlayerMedical,
  getFootballPlayerResearch,
  getFootballPlayerMetadata,
  getFootballPlayerDossier,
};