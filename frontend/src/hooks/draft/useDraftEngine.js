import { useState } from "react";

import { getAllProspects } from "../../data/draft/prospects/prospectRegistry";
import { resolveProspect } from "../../data/draft/prospects/resolveProspect";
import { buildProspectIntelligence } from "../../engines/ProspectIntelligenceEngine";
import { buildTeamDraftBoard } from "../../engines/DraftBoardEngine";

const userTeams = ["ARI"];

const draftOrder = [
  { overall: 3, round: 1, pickInRound: 3, team: "ARI" },
  { overall: 4, round: 1, pickInRound: 4, team: "CLE" },
  { overall: 5, round: 1, pickInRound: 5, team: "NYG" },
  { overall: 6, round: 1, pickInRound: 6, team: "TEN" },
  { overall: 7, round: 1, pickInRound: 7, team: "NYJ" },
  { overall: 8, round: 1, pickInRound: 8, team: "LV" },
  { overall: 9, round: 1, pickInRound: 9, team: "NO" },
  { overall: 10, round: 1, pickInRound: 10, team: "CAR" },
  { overall: 11, round: 1, pickInRound: 11, team: "MIA" },
  { overall: 12, round: 1, pickInRound: 12, team: "IND" },
];

function enrichProspect(prospect) {
  const resolvedProspect = resolveProspect(prospect);

  if (!resolvedProspect) return null;

  const prospectIntelligence = buildProspectIntelligence(resolvedProspect);

  return {
    ...resolvedProspect,
    ...prospect,

    profile: prospectIntelligence.profile,
    intelligence: prospectIntelligence.intelligence,
    prospectIntelligence,

    traits: prospectIntelligence.traits,
    evaluation: prospectIntelligence.evaluation,
    footballIQ: prospectIntelligence.footballIQ,
    athletics: prospectIntelligence.athletics,
    schemeFit: prospectIntelligence.schemeFit,
    production: prospectIntelligence.production,
    consensus: prospectIntelligence.consensus,
    recommendations: prospectIntelligence.recommendations,

    draftExplanation: prospect?.draftExplanation || null,
    teamDraftScore: prospect?.teamDraftScore || null,
    decisionScore: prospect?.decisionScore || null,
    intelligenceScore: prospect?.intelligenceScore || null,
    teamFitScore: prospect?.teamFitScore || null,
    consensusValue: prospect?.consensusValue || null,
  };
}

export default function useDraftEngine() {
  const [availableProspects, setAvailableProspects] = useState(getAllProspects);
  const [queuedProspects, setQueuedProspects] = useState([]);
  const [draftedProspects, setDraftedProspects] = useState([]);
  const [draftHistory, setDraftHistory] = useState([]);
  const [currentPickIndex, setCurrentPickIndex] = useState(0);
  const [selectedProspect, setSelectedProspect] = useState(
    enrichProspect(getAllProspects()[0])
  );

  const currentPick = draftOrder[currentPickIndex] || null;
  const isDraftComplete = currentPickIndex >= draftOrder.length;
  const isUserPick = currentPick ? userTeams.includes(currentPick.team) : false;

  function getProspectId(prospect) {
    return (
      prospect?.canonicalId ||
      prospect?.playerId ||
      prospect?.prospectId ||
      prospect?.id ||
      prospect?.rank
    );
  }

  function getProspectRank(prospect) {
    return prospect?.rank || prospect?.rankings?.overall || 9999;
  }

  function getNextAvailableProspect(currentProspects) {
    return [...currentProspects].sort(
      (a, b) => Number(getProspectRank(a)) - Number(getProspectRank(b))
    )[0];
  }

  function getPositionsDraftedByTeam(team) {
    return new Set(
      draftHistory
        .filter((draftPick) => draftPick.team === team)
        .map((draftPick) => draftPick.prospect?.position?.toLowerCase())
        .filter(Boolean)
    );
  }

  function getCpuProspectSelection() {
    if (!currentPick || !availableProspects.length) {
      return null;
    }

    const positionsDrafted = getPositionsDraftedByTeam(currentPick.team);

    try {
      const teamDraftBoard = buildTeamDraftBoard({
        players: availableProspects,
        team: currentPick.team,
        pick: currentPick,
        positionsDrafted,
      });

      return teamDraftBoard[0] || getNextAvailableProspect(availableProspects);
    } catch (error) {
      console.error("CPU Draft Board failed. Falling back to rank.", error);
      return getNextAvailableProspect(availableProspects);
    }
  }

  function handleSelectProspect(prospect) {
    setSelectedProspect(enrichProspect(prospect));
  }

  function handleToggleQueueProspect(prospect) {
    const enrichedProspect = enrichProspect(prospect);
    const prospectId = getProspectId(enrichedProspect);

    setQueuedProspects((currentQueue) => {
      const alreadyQueued = currentQueue.some(
        (queuedProspect) => getProspectId(queuedProspect) === prospectId
      );

      if (alreadyQueued) {
        return currentQueue.filter(
          (queuedProspect) => getProspectId(queuedProspect) !== prospectId
        );
      }

      return [...currentQueue, enrichedProspect];
    });
  }

  function completeDraftPick(prospect, draftMode = "manual") {
    const enrichedProspect = enrichProspect(prospect);

    if (!enrichedProspect || !currentPick || isDraftComplete) {
      return;
    }

    const prospectId = getProspectId(enrichedProspect);

    setAvailableProspects((currentProspects) => {
      const updatedProspects = currentProspects.filter(
        (availableProspect) => getProspectId(availableProspect) !== prospectId
      );

      setSelectedProspect((currentSelectedProspect) => {
        if (getProspectId(currentSelectedProspect || {}) !== prospectId) {
          return currentSelectedProspect;
        }

        return enrichProspect(getNextAvailableProspect(updatedProspects));
      });

      return updatedProspects;
    });

    setQueuedProspects((currentQueue) =>
      currentQueue.filter(
        (queuedProspect) => getProspectId(queuedProspect) !== prospectId
      )
    );

    setDraftedProspects((currentDraftedProspects) => {
      const alreadyDrafted = currentDraftedProspects.some(
        (draftedProspect) => getProspectId(draftedProspect) === prospectId
      );

      if (alreadyDrafted) return currentDraftedProspects;

      return [...currentDraftedProspects, enrichedProspect];
    });

    setDraftHistory((currentDraftHistory) => {
      const alreadyInHistory = currentDraftHistory.some(
        (draftPick) => getProspectId(draftPick.prospect) === prospectId
      );

      if (alreadyInHistory) return currentDraftHistory;

      return [
        ...currentDraftHistory,
        {
          overallPick: currentPick.overall,
          round: currentPick.round,
          pickInRound: currentPick.pickInRound,
          team: currentPick.team,
          prospect: enrichedProspect,
          draftMode,
          isUserPick,
          draftExplanation: enrichedProspect.draftExplanation,
          teamDraftScore: enrichedProspect.teamDraftScore,
          decisionScore: enrichedProspect.decisionScore,
          intelligenceScore: enrichedProspect.intelligenceScore,
          teamFitScore: enrichedProspect.teamFitScore,
          consensusValue: enrichedProspect.consensusValue,
          timestamp: Date.now(),
        },
      ];
    });

    setCurrentPickIndex((currentIndex) => currentIndex + 1);
  }

  function handleDraftProspect(prospect) {
    if (!isUserPick || isDraftComplete) return;

    completeDraftPick(prospect, "user");
  }

  function handleCpuPick() {
    if (
      !availableProspects.length ||
      !currentPick ||
      isUserPick ||
      isDraftComplete
    ) {
      return;
    }

    const cpuSelection = getCpuProspectSelection();

    if (!cpuSelection) {
      return;
    }

    completeDraftPick(cpuSelection, "cpu");
  }

  function handleUndoPick() {
    const lastDraftPick = draftHistory[draftHistory.length - 1];

    if (!lastDraftPick) return;

    const lastProspect = enrichProspect(lastDraftPick.prospect);
    const lastProspectId = getProspectId(lastProspect);

    setDraftHistory((currentDraftHistory) => currentDraftHistory.slice(0, -1));

    setDraftedProspects((currentDraftedProspects) =>
      currentDraftedProspects.filter(
        (draftedProspect) => getProspectId(draftedProspect) !== lastProspectId
      )
    );

    setAvailableProspects((currentProspects) => {
      const alreadyAvailable = currentProspects.some(
        (availableProspect) =>
          getProspectId(availableProspect) === lastProspectId
      );

      if (alreadyAvailable) return currentProspects;

      return [...currentProspects, lastProspect].sort(
        (a, b) => Number(getProspectRank(a)) - Number(getProspectRank(b))
      );
    });

    setSelectedProspect(lastProspect);
    setCurrentPickIndex((currentIndex) => Math.max(currentIndex - 1, 0));
  }

  return {
    availableProspects,
    queuedProspects,
    draftedProspects,
    draftHistory,
    currentPick,
    isDraftComplete,
    isUserPick,
    selectedProspect,
    handleSelectProspect,
    handleToggleQueueProspect,
    handleDraftProspect,
    handleCpuPick,
    handleUndoPick,
  };
}