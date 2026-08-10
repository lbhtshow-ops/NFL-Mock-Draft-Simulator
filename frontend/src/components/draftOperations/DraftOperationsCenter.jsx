import { useEffect, useMemo, useRef, useState } from "react";

import ProspectIntelligenceCenter from "../draftV3/Intelligence/ProspectIntelligenceCenter";
import DraftWire from "./DraftWire";
import { resolveSportsDraftWire, resolveSportsProspectIntelligence, resolveSportsTeamIntelligence } from "../../data/sportsIntelligence/SportsIntelligenceEngine";
import { getNFLRosterByTeam } from "../../data/footballIntelligence/nfl/rosters";
import { teamProfiles } from "../draftV3/WarRoom/WarRoomData";
import "../../styles/draft-operations-next.css";

const WAR_ROOM_TABS = [
  { id: "overview", label: "Overview" },
  { id: "needs", label: "Needs" },
  { id: "roster", label: "Roster" },
  { id: "drafted", label: "Drafted" },
  { id: "intel", label: "Intel" },
  { id: "identity", label: "Identity" },
  { id: "front-office", label: "Front Office" },
  { id: "capital", label: "Draft Capital" },
  { id: "queue", label: "Queue" },
];

const ROSTER_POSITION_ORDER = ["QB", "RB", "WR", "TE", "OT", "IOL", "C", "G", "EDGE", "DE", "DT", "DL", "LB", "CB", "S", "K", "P", "LS"];

function resolveTeamAbbreviation(team) {
  const direct = team?.abbreviation || team?.abbr || team?.short_name || team?.code;
  if (direct) return String(direct).toUpperCase();

  const teamName = String(team?.name || "").trim().toLowerCase();
  if (!teamName) return "";

  const match = Object.values(teamProfiles).find((profile) => {
    const profileName = String(profile?.name || "").toLowerCase();
    return profileName === teamName || profileName.endsWith(` ${teamName}`);
  });

  return match?.abbreviation || "";
}


function teamLogo(team) {
  if (!team?.name) return null;
  return `/logos/nfl/${team.name.toLowerCase()}.png`;
}

function normalizeNeedPosition(position) {
  if (position === "DE") return "EDGE";
  if (position === "DL") return "DT";
  if (position === "OL") return "IOL";
  return position;
}

function needClass(score) {
  if (score >= 90) return "critical";
  if (score >= 75) return "high";
  if (score >= 60) return "moderate";
  if (score >= 40) return "low";
  return "depth";
}

function formatPick(pick) {
  if (!pick?.draft_pick) return "--";
  return `${pick.draft_pick.round}.${String(pick.draft_pick.pick_number).padStart(2, "0")}`;
}

function playerGrade(player, getProspectGrade) {
  const value = Number(getProspectGrade?.(player));
  return Number.isFinite(value) ? value : "--";
}

const SPEED_OPTIONS = [
  { id: "slow", label: "Slow", delay: 2200 },
  { id: "normal", label: "Normal", delay: 1400 },
  { id: "fast", label: "Fast", delay: 800 },
  { id: "very-fast", label: "Very Fast", delay: 350 },
];

function formatClock(seconds) {
  if (!Number.isFinite(seconds)) return "--";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes > 0 ? `${minutes}:${String(remaining).padStart(2, "0")}` : `${remaining}s`;
}

function Metric({ label, value, tone = "default" }) {
  return (
    <div className={`next-metric ${tone !== "default" ? `is-${tone}` : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function NeedMeter({ need, compact = false }) {
  return (
    <div className={`next-need-row ${needClass(need.score)} ${compact ? "is-compact" : ""}`}>
      <strong className="next-need-position">{need.position}</strong>
      <div className="next-need-track"><span style={{ width: `${need.score}%` }} /></div>
      <b>{need.score}</b>
      <small>{need.label}</small>
    </div>
  );
}

export default function DraftOperationsCenter({
  draft,
  picks,
  filteredPlayers,
  allPlayers = [],
  currentPick,
  currentTeam,
  userControlledTeams,
  teamDirectory = [],
  paused,
  timeLeft,
  autoPickDelay,
  soundsMuted,
  positionFilter,
  positionOptions,
  searchQuery,
  selectedPlayer,
  isSelecting,
  onSelectPlayer,
  onPreviewPlayer,
  onPositionFilterChange,
  onSearchChange,
  onPause,
  onUndo,
  onTrade,
  onRestart,
  onAutoPickDelayChange,
  onToggleSound,
  draftMode = "standard",
  onSimCpuPick,
  getProspectGrade,
  getProspectTier,
  getProspectProjection,
  cpuDecision = null,
  getTeamDraftCapital,
}) {
  const [warRoomTab, setWarRoomTab] = useState("overview");
  const [queue, setQueue] = useState([]);
  const [myTeamsOpen, setMyTeamsOpen] = useState(false);
  const prospectWorkspaceRef = useRef(null);
  const timelineRef = useRef(null);
  const controlledTeams = useMemo(() => {
    const directoryById = new Map((teamDirectory || []).filter(Boolean).map((team) => [team.id, team]));
    picks.forEach((pick) => {
      if (pick?.team?.id && !directoryById.has(pick.team.id)) directoryById.set(pick.team.id, pick.team);
      if (pick?.original_team?.id && !directoryById.has(pick.original_team.id)) directoryById.set(pick.original_team.id, pick.original_team);
    });
    return (userControlledTeams || []).map((teamId) => directoryById.get(teamId)).filter(Boolean);
  }, [teamDirectory, picks, userControlledTeams]);
  const defaultWarRoomTeam = controlledTeams[0] || currentTeam || null;
  const [warRoomTeamId, setWarRoomTeamId] = useState(null);
  const warRoomTeam = useMemo(() => {
    if (warRoomTeamId) {
      const controlledMatch = controlledTeams.find((team) => team?.id === warRoomTeamId);
      if (controlledMatch) return controlledMatch;
      const inspectedTeam = picks.find((pick) => pick?.team?.id === warRoomTeamId)?.team;
      if (inspectedTeam) return inspectedTeam;
      const directoryMatch = teamDirectory.find((team) => team?.id === warRoomTeamId);
      if (directoryMatch) return directoryMatch;
    }
    return defaultWarRoomTeam;
  }, [picks, teamDirectory, controlledTeams, warRoomTeamId, defaultWarRoomTeam]);

  const selectableTeams = useMemo(() => {
    const byId = new Map();
    (teamDirectory || []).forEach((team) => { if (team?.id) byId.set(team.id, team); });
    controlledTeams.forEach((team) => { if (team?.id) byId.set(team.id, team); });
    picks.forEach((pick) => { if (pick?.team?.id) byId.set(pick.team.id, pick.team); });
    return [...byId.values()].sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")));
  }, [teamDirectory, controlledTeams, picks]);

  const warRoomTeamAbbreviation = useMemo(() => resolveTeamAbbreviation(warRoomTeam), [warRoomTeam]);
  const warRoomTeamContext = useMemo(() => (
    warRoomTeam ? { ...warRoomTeam, abbreviation: warRoomTeamAbbreviation || warRoomTeam.abbreviation } : null
  ), [warRoomTeam, warRoomTeamAbbreviation]);
  const sportsTeamIntel = useMemo(() => resolveSportsTeamIntelligence(warRoomTeamContext), [warRoomTeamContext]);
  const selectedSportsIntel = useMemo(() => resolveSportsProspectIntelligence(selectedPlayer), [selectedPlayer]);
  const needs = sportsTeamIntel?.needs || { rows: [], sorted: [], coverage: null, engineAvailable: false };
  const teamIntel = {
    connected: sportsTeamIntel?.sportsIntelligence?.footballIntelligenceAvailable || false,
    sourceClassification: sportsTeamIntel?.sourceClassification || "UNAVAILABLE",
    owner: sportsTeamIntel?.organization?.owner || "Not yet established",
    president: sportsTeamIntel?.organization?.president || "Not yet established",
    generalManager: sportsTeamIntel?.organization?.generalManager || "Not yet established",
    headCoach: sportsTeamIntel?.organization?.headCoach || "Not yet established",
    offensiveCoordinator: sportsTeamIntel?.organization?.offensiveCoordinator || "Not yet established",
    defensiveCoordinator: sportsTeamIntel?.organization?.defensiveCoordinator || "Not yet established",
    window: sportsTeamIntel?.organization?.competitiveWindow || "Not yet established",
    offensiveScheme: sportsTeamIntel?.identity?.offensiveScheme || "Not yet established",
    defensiveScheme: sportsTeamIntel?.identity?.defensiveScheme || "Not yet established",
    teamBuildingStyle: sportsTeamIntel?.identity?.teamBuildingStyle || "Not yet established",
    riskTolerance: sportsTeamIntel?.identity?.riskTolerance || "Not yet established",
    bpaPreference: sportsTeamIntel?.identity?.bpaPreference ?? null,
    needPreference: sportsTeamIntel?.identity?.needPreference ?? null,
    tradeUpWillingness: sportsTeamIntel?.identity?.tradeUpWillingness ?? null,
    tradeDownWillingness: sportsTeamIntel?.identity?.tradeDownWillingness ?? null,
    draftNotes: sportsTeamIntel?.identity?.draftNotes || [],
    decisionProfileSource: sportsTeamIntel?.identity?.sourceClassification || "UNAVAILABLE",
    gmDraftAndDevelop: sportsTeamIntel?.signals?.gmDraftAndDevelop ?? null,
    gmContinuity: sportsTeamIntel?.signals?.gmContinuity ?? null,
    coachAdaptability: sportsTeamIntel?.signals?.coachAdaptability ?? null,
    coachDevelopment: sportsTeamIntel?.signals?.coachDevelopment ?? null,
  };
  const needByPosition = useMemo(
    () => Object.fromEntries(needs.rows.map((need) => [need.position, need])),
    [needs.rows]
  );

  const completed = picks.filter((pick) => pick.player);
  const timelinePicks = picks;

  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline || !currentPick?.id) return;

    const currentCard = Array.from(timeline.querySelectorAll("[data-timeline-pick-id]")).find(
      (card) => card.dataset.timelinePickId === String(currentPick.id)
    );

    currentCard?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [currentPick?.id]);

  const handleTimelineWheel = (event) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.currentTarget.scrollLeft += event.deltaY;
  };

  const userTurn = Boolean(currentPick && userControlledTeams.includes(currentPick.team.id));
  const draftProgress = picks.length ? Math.round((completed.length / picks.length) * 100) : 0;
  const currentRound = currentPick?.draft_pick?.round || "--";
  const roundPicks = picks.filter((pick) => pick?.draft_pick?.round === currentRound);
  const teamsRemainingThisRound = roundPicks.filter((pick) => !pick.player).length;
  const currentTeamPicks = picks.filter((pick) => pick?.team?.id === warRoomTeam?.id);
  const teamDraftCapital = useMemo(() => {
    if (!warRoomTeam) return [];
    const resolved = getTeamDraftCapital?.(warRoomTeam);
    return Array.isArray(resolved) ? resolved : currentTeamPicks;
  }, [warRoomTeam, getTeamDraftCapital, currentTeamPicks]);
  const currentYearCapital = teamDraftCapital.filter((pick) => !pick.isFuturePick);
  const futureCapital = teamDraftCapital.filter((pick) => pick.isFuturePick);
  const draftedTeamPicks = currentTeamPicks.filter((pick) => pick.player);
  const recentTeamPicks = draftedTeamPicks.slice(-5).reverse();
  const currentRoster = useMemo(() => {
    if (!warRoomTeamAbbreviation) return [];
    const rosterAbbreviation = warRoomTeamAbbreviation === "LAR" ? "LA" : warRoomTeamAbbreviation;
    return getNFLRosterByTeam(rosterAbbreviation);
  }, [warRoomTeamAbbreviation]);
  const rosterGroups = useMemo(() => {
    const groups = currentRoster.reduce((result, player) => {
      const position = player?.identity?.position || "OTHER";
      if (!result[position]) result[position] = [];
      result[position].push(player);
      return result;
    }, {});

    return Object.entries(groups).sort(([positionA], [positionB]) => {
      const orderA = ROSTER_POSITION_ORDER.indexOf(positionA);
      const orderB = ROSTER_POSITION_ORDER.indexOf(positionB);
      const normalizedA = orderA === -1 ? 999 : orderA;
      const normalizedB = orderB === -1 ? 999 : orderB;
      return normalizedA - normalizedB || positionA.localeCompare(positionB);
    });
  }, [currentRoster]);
  const topNeeds = needs.sorted.filter((need) => need.score > 0).slice(0, 4);
  const availableIds = useMemo(() => new Set(allPlayers.map((player) => player.id)), [allPlayers]);
  const queuedPlayers = queue
    .map((id) => allPlayers.find((player) => player.id === id))
    .filter(Boolean);
  const draftWireFeed = useMemo(
    () => resolveSportsDraftWire({
      draft,
      currentTeam,
      currentPick,
      cpuDecision,
      queueCount: queuedPlayers.length,
    }),
    [draft, currentTeam, currentPick, cpuDecision, queuedPlayers.length]
  );

  useEffect(() => {
    setQueue((previous) => previous.filter((id) => availableIds.has(id)));
  }, [availableIds]);

  useEffect(() => {
    if (!warRoomTeamId) return;
    const exists = controlledTeams.some((team) => team?.id === warRoomTeamId)
      || teamDirectory.some((team) => team?.id === warRoomTeamId)
      || picks.some((pick) => pick?.team?.id === warRoomTeamId);
    if (!exists) setWarRoomTeamId(null);
  }, [picks, teamDirectory, controlledTeams, warRoomTeamId]);

  useEffect(() => {
    setMyTeamsOpen(false);
  }, [warRoomTeamId]);

  const selectMyTeam = (teamId) => {
    setWarRoomTeamId(teamId || null);
    setMyTeamsOpen(false);
  };

  const scrollToProspectIntelligence = () => {
    prospectWorkspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleQueue = (player) => {
    setQueue((previous) =>
      previous.includes(player.id)
        ? previous.filter((id) => id !== player.id)
        : [...previous, player.id]
    );
  };


  return (
    <div className="doc-next">
      <DraftWire feed={draftWireFeed} />
      {draft?.year === 2027 && draft?.preview_limited ? (
        <div className="next-runtime-coverage-note" role="status">
          <strong>Development coverage</strong>
          <span>{draft.prospect_count || allPlayers.length} researched prospects currently have enriched intelligence coverage.</span>
        </div>
      ) : null}
      <section className="next-workspace next-command-center">
        <div className="next-command-main">
          <div className="next-brand-block">
            <span className="next-kicker">LBHT Football Operations</span>
            <h1>Draft Operations Center</h1>
            <p>Live decision support powered by the Football Intelligence Platform.</p>
          </div>

          <div className="next-on-clock">
            {teamLogo(currentTeam) && <img src={teamLogo(currentTeam)} alt="" />}
            <div>
              <span>On The Clock</span>
              <strong>{currentTeam?.name || "Loading draft"}</strong>
              <small>{userTurn ? "User controlled" : "CPU controlled"} · Pick {formatPick(currentPick)} · {draftMode.replace("-", " ")}</small>
            </div>
          </div>

          <div className="next-command-actions" aria-label="Draft controls">
            <button type="button" className="primary" onClick={onPause}>{paused ? "Resume" : "Pause"}</button>
            <button type="button" onClick={onTrade}>Trade Center</button>
            <button type="button" onClick={onUndo} disabled={!completed.length}>Undo</button>
            <button type="button" className="danger" onClick={onRestart}>Restart</button>
            {!userTurn && currentPick && <button type="button" className="sim" onClick={onSimCpuPick}>Sim CPU Pick</button>}
            <button
              type="button"
              className={`next-sound-toggle ${soundsMuted ? "is-muted" : "is-on"}`}
              onClick={onToggleSound}
              aria-pressed={!soundsMuted}
              title={soundsMuted ? "Enable draft sounds" : "Mute draft sounds"}
            >
              <span aria-hidden="true">{soundsMuted ? "🔇" : "🔊"}</span>
              <strong>Sound</strong>
              <em>{soundsMuted ? "Off" : "On"}</em>
            </button>
          </div>
        </div>

        <div className="next-command-console">
          <div className="next-metrics-grid">
            <Metric label="Draft Class" value={draft?.year || "--"} />
            <Metric label="Round" value={currentRound} />
            <Metric label="Current Pick" value={formatPick(currentPick)} tone="gold" />
            <Metric label="Clock" value={paused ? "Paused" : formatClock(timeLeft)} tone={paused ? "warning" : "teal"} />
            <Metric label="Completed" value={`${completed.length}/${picks.length}`} />
            <Metric label="Teams Left" value={teamsRemainingThisRound} />
          </div>

          <div className="next-simulation-controls">
            <div className="next-speed-control">
              <span>Draft Speed</span>
              <div className="next-speed-segments" role="group" aria-label="Draft speed">
                {SPEED_OPTIONS.map((speed) => (
                  <button
                    key={speed.id}
                    type="button"
                    className={autoPickDelay === speed.delay ? "active" : ""}
                    onClick={() => onAutoPickDelayChange(speed.delay)}
                  >
                    {speed.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="next-mode-status next-mode-status-compact" aria-label={`Draft mode: ${draftMode}`}>
              <span>Mode</span>
              <strong><i aria-hidden="true" />{draftMode === "broadcast" ? "Broadcast" : draftMode.charAt(0).toUpperCase() + draftMode.slice(1)}</strong>
            </div>
          </div>
        </div>

        <div className="next-progress-line">
          <span style={{ width: `${draftProgress}%` }} />
        </div>

      </section>

      <section className="next-workspace next-timeline-workspace next-timeline-compact" aria-label="Draft timeline">
        <div className="next-timeline-heading">
          <div>
            <span className="next-kicker">Draft Timeline</span>
            <small>Recent picks · on the clock · upcoming teams</small>
          </div>
          <div className="next-timeline-actions">
            <span><strong>{draftProgress}%</strong> complete</span>
          </div>
        </div>
        <div
          className="next-timeline"
          ref={timelineRef}
          onWheel={handleTimelineWheel}
          tabIndex={0}
          aria-label="Scrollable draft history and upcoming picks"
        >
          {timelinePicks.map((pick) => {
            const isCurrent = pick.id === currentPick?.id;
            const isInspected = pick?.team?.id === warRoomTeam?.id;
            const playerSchool = pick.player?.school || pick.player?.college || "";
            return (
              <button
                key={pick.id}
                type="button"
                data-timeline-pick-id={pick.id}
                className={`next-timeline-pick ${pick.player ? "complete" : ""} ${isCurrent ? "current" : ""} ${isInspected ? "inspected" : ""}`}
                onClick={() => pick?.team?.id && setWarRoomTeamId(pick.team.id)}
                aria-pressed={isInspected}
                title={`Open ${pick.team?.name || "team"} War Room`}
              >
                <span>{formatPick(pick)}</span>
                <strong>{pick.team?.name || "Team"}</strong>
                {pick.player ? (
                  <>
                    <small className="next-timeline-player">{pick.player.name}</small>
                    <em>{[pick.player.position, playerSchool].filter(Boolean).join(" · ")}</em>
                  </>
                ) : (
                  <small>{isCurrent ? "ON THE CLOCK" : "Upcoming"}</small>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className={`next-decision-grid ${selectedPlayer ? "has-selected-prospect" : ""}`}>
        <div className="next-workspace next-big-board">
          <div className="next-workspace-header">
            <div>
              <span className="next-kicker">Decision Workspace</span>
              <h2>Big Board</h2>
            </div>
            <div className="next-header-meta">
              <strong>{filteredPlayers.length}</strong>
              <span>Available prospects</span>
            </div>
          </div>

          <div className="next-board-tools">
            <div className="next-search-field">
              <input
                aria-label="Search prospects"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search player or school"
              />
              {searchQuery ? (
                <button
                  type="button"
                  className="next-search-clear"
                  onClick={() => onSearchChange("")}
                  aria-label="Clear prospect search"
                  title="Clear search"
                >
                  ×
                </button>
              ) : null}
            </div>
            <select
              aria-label="Filter by position"
              value={positionFilter?.value || "ALL"}
              onChange={(event) => onPositionFilterChange(positionOptions.find((option) => option.value === event.target.value))}
            >
              {positionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>

          {selectedPlayer ? (
            <button type="button" className="next-mobile-prospect-jump" onClick={scrollToProspectIntelligence}>
              View {selectedPlayer.name || "Prospect"} Intel ↓
            </button>
          ) : null}

          <div className="next-board-scroll">
            <table className="next-board-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Prospect</th>
                  <th>Intel Grade</th>
                  <th>Tier</th>
                  <th>Projection</th>
                  <th>Need</th>
                  <th>Queue</th>
                  <th aria-label="Draft action" />
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player) => {
                  const selected = selectedPlayer?.id === player.id;
                  const need = needByPosition[normalizeNeedPosition(player.position)] || { score: 0, label: "Depth" };

                  return (
                    <tr key={player.id} className={selected ? "selected" : ""} onClick={() => onPreviewPlayer(player)}>
                      <td className="rank-cell">#{player.rank}</td>
                      <td className="player-cell">
                        <strong>{player.name}</strong>
                        <span>{player.position} · {player.school || player.college || "School pending"}</span>
                      </td>
                      <td className="grade-cell">{playerGrade(player, getProspectGrade)}</td>
                      <td>{getProspectTier(player)}</td>
                      <td>{getProspectProjection(player)}</td>
                      <td>
                        <span className={`next-need-badge ${needClass(need.score)}`}>{need.score || "--"}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`next-queue-btn ${queue.includes(player.id) ? "active" : ""}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleQueue(player);
                          }}
                          aria-label={queue.includes(player.id) ? `Remove ${player.name} from queue` : `Add ${player.name} to queue`}
                        >
                          {queue.includes(player.id) ? "Queued" : "+ Queue"}
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          disabled={!userTurn || isSelecting}
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectPlayer(player);
                          }}
                        >
                          {isSelecting ? "Selecting" : "Draft"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <section className="next-workspace next-draft-intelligence-strip next-team-context-strip" aria-label="Sports Intelligence team context">
          <div className="next-team-context-intel">
            <span className="next-kicker">Sports Intelligence · CPU Front Office</span>
            <strong>{cpuDecision?.available && cpuDecision?.recommendation
              ? `${cpuDecision.team?.name || "CPU Team"}: ${cpuDecision.recommendation.name}`
              : `${currentTeam?.name || "Draft"} front-office context`}</strong>
            <p>{cpuDecision?.available && cpuDecision?.recommendation
              ? (cpuDecision.recommendation.reasons?.slice(0, 2).join(" · ") || "Sports Intelligence decision support selected the best available organizational fit.")
              : "Select any NFL team to inspect its War Room context."}</p>
          </div>

          {cpuDecision?.available && cpuDecision?.recommendation ? (
            <div className="next-draft-intelligence-metrics">
              <span><small>Decision</small><b>{cpuDecision.recommendation.decisionScore ?? "--"}</b></span>
              <span><small>Confidence</small><b>{cpuDecision.recommendation.confidence ?? "--"}{Number.isFinite(cpuDecision.recommendation.confidence) ? "%" : ""}</b></span>
              <span><small>Position</small><b>{cpuDecision.recommendation.position || "--"}</b></span>
            </div>
          ) : null}

          <div className="next-team-context-controls">
            <label>
              <span>View NFL Team</span>
              <select
                value={warRoomTeam?.id || ""}
                onChange={(event) => setWarRoomTeamId(Number(event.target.value) || null)}
                aria-label="Select NFL team to display in War Room"
              >
                {selectableTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
            </label>
            {controlledTeams.length ? (
              <div className="next-my-teams-control next-team-context-my-teams">
                <button
                  type="button"
                  className="next-my-teams-trigger"
                  onClick={() => controlledTeams.length > 1 ? setMyTeamsOpen((open) => !open) : selectMyTeam(controlledTeams[0]?.id)}
                  aria-haspopup={controlledTeams.length > 1 ? "menu" : undefined}
                  aria-expanded={controlledTeams.length > 1 ? myTeamsOpen : undefined}
                >
                  My {controlledTeams.length > 1 ? "Teams" : "Team"}{controlledTeams.length > 1 ? " ▾" : ""}
                </button>
                {controlledTeams.length > 1 && myTeamsOpen ? (
                  <div className="next-my-teams-menu" role="menu">
                    {controlledTeams.map((team) => (
                      <button key={team.id} type="button" role="menuitem" onClick={() => selectMyTeam(team.id)}>
                        <strong>{team.name}</strong>
                        {team.id === warRoomTeam?.id ? <span>Viewing</span> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        <aside className="next-workspace next-war-room">
          <div className="next-workspace-header next-war-header">
            <div>
              <span className="next-kicker">Team Intelligence</span>
              <h2>War Room</h2>
            </div>
            <span className={`next-source-state ${teamIntel.connected ? "connected" : "partial"}`}>
              {teamIntel.connected ? "Sports Intelligence Connected" : teamIntel.sourceClassification === "TRANSITIONAL_TEAM_CONTEXT" ? "Transitional Context" : "Partial Coverage"}
            </span>
          </div>

          <div className="next-war-team next-war-team-premium">
            {teamLogo(warRoomTeam) && <img src={teamLogo(warRoomTeam)} alt="" />}
            <div className="next-war-team-identity">
              <span className="next-war-team-label">{warRoomTeam?.id === defaultWarRoomTeam?.id ? "Your Front Office" : "Viewing Front Office"}</span>
              <strong>{warRoomTeam?.name || "Team"}</strong>
              <span>{teamIntel.window}</span>
            </div>
            <div className="next-war-team-summary">
              <span><small>Top Need</small><b>{topNeeds[0]?.position || "--"} {topNeeds[0]?.score || ""}</b></span>
              <span><small>Build Style</small><b>{String(teamIntel.teamBuildingStyle).replaceAll("-", " ")}</b></span>
            </div>
          </div>

          <div className="next-war-tabs" role="tablist" aria-label="War Room views">
            {WAR_ROOM_TABS.map((tab) => (
              <button
                type="button"
                role="tab"
                aria-selected={warRoomTab === tab.id}
                className={warRoomTab === tab.id ? "active" : ""}
                key={tab.id}
                onClick={() => setWarRoomTab(tab.id)}
              >
                {tab.id === "queue" ? `Draft Queue (${queuedPlayers.length})` : tab.label}
              </button>
            ))}
          </div>

          <div className="next-war-content">
            {warRoomTab === "overview" && (
              <div className="next-war-overview next-war-overview-premium">
                <section className="next-war-card next-war-leadership-card">
                  <div className="next-war-card-title"><h3>Front Office</h3><span>Organization</span></div>
                  <dl>
                    <div><dt>General Manager</dt><dd>{teamIntel.generalManager}</dd></div>
                    <div><dt>Head Coach</dt><dd>{teamIntel.headCoach}</dd></div>
                    <div><dt>Offense</dt><dd>{teamIntel.offensiveScheme}</dd></div>
                    <div><dt>Defense</dt><dd>{teamIntel.defensiveScheme}</dd></div>
                  </dl>
                </section>

                <section className="next-war-card next-war-needs-summary">
                  <div className="next-war-card-title"><h3>Priority Needs</h3><span>Team Intelligence · 0–100</span></div>
                  <div className="next-needs-stack">
                    {topNeeds.length ? topNeeds.map((need) => <NeedMeter key={need.position} need={need} compact />) : <p className="next-empty">Need evaluation pending.</p>}
                  </div>
                </section>

                <section className="next-war-card next-war-decision-card">
                  <div className="next-war-card-title"><h3>Draft Decision Profile</h3><span>{teamIntel.decisionProfileSource === "TRANSITIONAL_DECISION_PROFILE" ? "Team profile" : "Transitional baseline"}</span></div>
                  <div className="next-signal-grid next-signal-grid-profile">
                    <Metric label="BPA" value={teamIntel.bpaPreference ?? "--"} />
                    <Metric label="Need" value={teamIntel.needPreference ?? "--"} />
                    <Metric label="Trade Up" value={teamIntel.tradeUpWillingness ?? "--"} />
                    <Metric label="Trade Down" value={teamIntel.tradeDownWillingness ?? "--"} />
                  </div>
                </section>
              </div>
            )}

            {warRoomTab === "needs" && (
              <section className="next-war-card next-needs-card">
                <div className="next-war-card-title">
                  <div><h3>Position Need Evaluation</h3><p>Need is evaluated independently from player quality.</p></div>
                  <span>{needs.engineAvailable ? "Roster engine" : "Context fallback"}</span>
                </div>
                <div className="next-needs-stack full">
                  {needs.sorted.map((need) => <NeedMeter key={need.position} need={need} />)}
                </div>
              </section>
            )}

            {warRoomTab === "roster" && (
              <section className="next-war-card next-roster-card">
                <div className="next-war-card-title">
                  <div><h3>Current Roster</h3><p>Current roster context for the selected franchise.</p></div>
                  <span>{currentRoster.length ? `${currentRoster.length} players` : "Coverage pending"}</span>
                </div>
                {rosterGroups.length ? (
                  <div className="next-roster-groups">
                    {rosterGroups.map(([position, playersAtPosition]) => (
                      <div className="next-roster-position" key={position}>
                        <div className="next-roster-position-heading"><strong>{position}</strong><span>{playersAtPosition.length}</span></div>
                        <div className="next-roster-player-list">
                          {playersAtPosition.map((player) => (
                            <div className="next-roster-player" key={player.playerId}>
                              <span>
                                <strong>{player.identity?.playerName || "Player name pending"}</strong>
                                <small>{player.roster?.status || "Active"}{Number.isFinite(player.identity?.experience) ? ` · ${player.identity.experience} yrs` : ""}</small>
                              </span>
                              <em>{player.roster?.starter ? "Starter" : player.roster?.rosterRole || "Roster"}</em>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="next-empty">Current roster data is not connected for this franchise yet.</p>}
              </section>
            )}

            {warRoomTab === "drafted" && (
              <section className="next-war-card next-drafted-card">
                <div className="next-war-card-title">
                  <div><h3>Drafted Players</h3><p>Selections made by {warRoomTeam?.name || "this team"} in the current draft.</p></div>
                  <span>{draftedTeamPicks.length} selected</span>
                </div>
                <div className="next-drafted-list">
                  {draftedTeamPicks.length ? draftedTeamPicks.map((pick) => (
                    <button key={pick.id} type="button" onClick={() => pick.player && onPreviewPlayer(pick.player)}>
                      <b>{formatPick(pick)}</b>
                      <span><strong>{pick.player?.name || "Selection pending"}</strong><small>{pick.player?.position || "--"} · {pick.player?.school || pick.player?.college || "School pending"}</small></span>
                      <em>Round {pick.draft_pick?.round || "--"}</em>
                    </button>
                  )) : <p className="next-empty">This team has not made a selection yet.</p>}
                </div>
              </section>
            )}

            {warRoomTab === "intel" && (
              <div className="next-war-overview next-team-intel-tab">
                <section className="next-war-card">
                  <div className="next-war-card-title"><h3>Team Intelligence</h3><span>{sportsTeamIntel?.sourceClassification || "Coverage pending"}</span></div>
                  <div className="next-intel-summary-grid">
                    <div><span>Build Style</span><strong>{String(teamIntel.teamBuildingStyle).replaceAll("-", " ")}</strong></div>
                    <div><span>Risk Profile</span><strong>{teamIntel.riskTolerance}</strong></div>
                    <div><span>Competitive Window</span><strong>{teamIntel.window}</strong></div>
                    <div><span>Top Need</span><strong>{topNeeds[0]?.position || "Pending"}</strong></div>
                  </div>
                </section>
                <section className="next-war-card">
                  <div className="next-war-card-title"><h3>Draft Strategy Signals</h3><span>Decision context</span></div>
                  <div className="next-signal-grid next-signal-grid-profile">
                    <Metric label="BPA" value={teamIntel.bpaPreference ?? "--"} />
                    <Metric label="Need" value={teamIntel.needPreference ?? "--"} />
                    <Metric label="Trade Up" value={teamIntel.tradeUpWillingness ?? "--"} />
                    <Metric label="Trade Down" value={teamIntel.tradeDownWillingness ?? "--"} />
                  </div>
                  <p className="next-intel-note">Draft Intelligence and Trade Intelligence will enrich this view as those engines are connected. No independent football decision logic is implemented in the UI.</p>
                </section>
              </div>
            )}

            {warRoomTab === "capital" && (
              <div className="next-war-overview">
                <section className="next-war-card">
                  <div className="next-war-card-title">
                    <div><h3>{draft?.year || "Current"} Draft Capital</h3><p>Full seven-round ownership, independent of mock length.</p></div>
                    <span>{currentYearCapital.length} picks</span>
                  </div>
                  <div className="next-pick-grid next-full-capital-grid">
                    {currentYearCapital.length ? currentYearCapital.map((pick) => (
                      <div key={pick.id} className={pick.player ? "is-used" : ""}>
                        <strong>{formatPick(pick)}</strong>
                        <span>Round {pick.draft_pick?.round} · {pick.player ? "Used" : "Available"}</span>
                      </div>
                    )) : <p className="next-empty">Draft-capital data is unavailable for this team.</p>}
                  </div>
                </section>
                <section className="next-war-card">
                  <div className="next-war-card-title">
                    <div><h3>Future Draft Capital</h3><p>Future-round assets currently owned in this mock session.</p></div>
                    <span>{futureCapital.length} picks</span>
                  </div>
                  <div className="next-pick-grid next-full-capital-grid">
                    {futureCapital.length ? futureCapital.map((pick) => (
                      <div key={pick.id}><strong>Future R{pick.draft_pick?.round}</strong><span>Round {pick.draft_pick?.round}</span></div>
                    )) : <p className="next-empty">No future-pick assets are currently modeled.</p>}
                  </div>
                </section>
                <section className="next-war-card">
                  <h3>Recent Selections</h3>
                  <div className="next-recent-picks">
                    {recentTeamPicks.length ? recentTeamPicks.map((pick) => (
                      <div key={pick.id}><span>{formatPick(pick)}</span><strong>{pick.player?.name}</strong><small>{pick.player?.position}</small></div>
                    )) : <p className="next-empty">No selections yet.</p>}
                  </div>
                </section>
              </div>
            )}

            {warRoomTab === "identity" && (
              <div className="next-war-overview">
                <section className="next-war-card next-war-identity-card">
                  <div className="next-war-card-title"><h3>Football Identity</h3><span>Team Context</span></div>
                  <div className="next-identity-grid">
                    <div><span>Offensive System</span><strong>{teamIntel.offensiveScheme}</strong></div>
                    <div><span>Defensive System</span><strong>{teamIntel.defensiveScheme}</strong></div>
                    <div><span>Team Building</span><strong>{String(teamIntel.teamBuildingStyle).replaceAll("-", " ")}</strong></div>
                    <div><span>Risk Profile</span><strong>{teamIntel.riskTolerance}</strong></div>
                  </div>
                </section>
                <section className="next-war-card">
                  <div className="next-war-card-title"><h3>Draft Philosophy</h3><span>Decision Support Context</span></div>
                  <div className="next-philosophy-list">
                    {teamIntel.draftNotes.length ? teamIntel.draftNotes.map((note) => <div key={note}><span>◆</span><p>{note}</p></div>) : <p className="next-empty">Detailed organizational philosophy is not yet established for this team.</p>}
                  </div>
                </section>
              </div>
            )}

            {warRoomTab === "front-office" && (
              <div className="next-war-overview">
                <section className="next-war-card">
                  <h3>Leadership</h3>
                  <dl>
                    <div><dt>Owner</dt><dd>{teamIntel.owner}</dd></div>
                    <div><dt>President</dt><dd>{teamIntel.president}</dd></div>
                    <div><dt>General Manager</dt><dd>{teamIntel.generalManager}</dd></div>
                    <div><dt>Head Coach</dt><dd>{teamIntel.headCoach}</dd></div>
                    <div><dt>Offensive Coordinator</dt><dd>{teamIntel.offensiveCoordinator}</dd></div>
                    <div><dt>Defensive Coordinator</dt><dd>{teamIntel.defensiveCoordinator}</dd></div>
                  </dl>
                </section>
                <section className="next-war-card">
                  <h3>Decision Context</h3>
                  <dl>
                    <div><dt>Competitive Window</dt><dd>{teamIntel.window}</dd></div>
                    <div><dt>Offensive Identity</dt><dd>{teamIntel.offensiveScheme}</dd></div>
                    <div><dt>Defensive Identity</dt><dd>{teamIntel.defensiveScheme}</dd></div>
                  </dl>
                </section>
              </div>
            )}

            {warRoomTab === "queue" && (
              <section className="next-war-card next-draft-board-card">
                <div className="next-war-card-title">
                  <div>
                    <h3>Draft Queue</h3>
                    <p>Prioritize prospects for your next selection.</p>
                  </div>
                  <span>{queuedPlayers.length} queued</span>
                </div>
                <div className="next-draft-board-list">
                  {queuedPlayers.length ? queuedPlayers.map((player, index) => (
                    <button key={player.id} type="button" onClick={() => onPreviewPlayer(player)}>
                      <b>{index + 1}</b>
                      <span><strong>{player.name}</strong><small>{player.position} · {player.school || player.college || "School pending"}</small></span>
                      <em>{playerGrade(player, getProspectGrade)}</em>
                    </button>
                  )) : (
                    <p className="next-empty">Use the + Queue button on the Big Board to add prioritized prospects here.</p>
                  )}
                </div>
              </section>
            )}
          </div>
        </aside>

        <section ref={prospectWorkspaceRef} className="next-workspace next-prospect-workspace">
        <div className="next-workspace-header">
          <div>
            <span className="next-kicker">Football Intelligence</span>
            <h2>Prospect Intelligence Center</h2>
          </div>
          <div className="next-header-meta next-selected-prospect">
            <strong>{selectedSportsIntel?.profile?.bio?.playerName || selectedSportsIntel?.developmentProjection?.subject?.name || selectedPlayer?.name || "Select a prospect"}</strong>
            <span>{selectedPlayer ? `${selectedSportsIntel?.profile?.bio?.position || selectedSportsIntel?.developmentProjection?.subject?.position || selectedPlayer.position} · ${selectedSportsIntel?.profile?.bio?.school || selectedSportsIntel?.developmentProjection?.subject?.school || selectedPlayer.school || selectedPlayer.college || "School pending"}` : "Big Board selection drives this workspace"}</span>
            {selectedPlayer ? (
              <em className="next-intelligence-source">
                {selectedSportsIntel?.sportsIntelligence?.sourceClassification === "FOOTBALL_INTELLIGENCE_PLATFORM"
                  ? "Sports Intelligence: governed football intelligence"
                  : selectedSportsIntel?.sportsIntelligence?.sourceClassification === "DEVELOPMENT_FIXTURE_PROJECTION"
                    ? "Sports Intelligence: 2027 development evidence · modeled grades pending"
                    : "Sports Intelligence: coverage pending"}
              </em>
            ) : null}
          </div>
        </div>

          <ProspectIntelligenceCenter
            player={selectedPlayer}
            getProspectGrade={getProspectGrade}
            getProspectTier={getProspectTier}
            getProspectProjection={getProspectProjection}
          />
        </section>
      </section>

    </div>
  );
}
