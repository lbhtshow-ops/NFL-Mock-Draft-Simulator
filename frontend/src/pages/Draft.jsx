/* eslint-disable no-unused-vars */
/* 
    * Draft page component. Handles draft process, including player selection, trades, and team management.
*/


// Import necessary libraries and components
import React from "react";
import { useState, useEffect, useRef } from "react";
import { useLocation, useParams, useNavigate, Link } from "react-router-dom";
import Select from "react-select";
import axios from "axios";
import { getSportsProspectDecisionDisplay, resolveSportsDraftDecision } from "../data/sportsIntelligence/SportsIntelligenceEngine";
import { buildDraftableProspectPool } from "../data/footballIntelligence/prospectCatalog/DraftableProspectPool.js";
import "../styles/draft-operations-restored.css";
import DraftOperationsCenter from "../components/draftOperations/DraftOperationsCenter";
import TradeOperationsCenter from "../components/draftOperations/TradeOperationsCenter";

// Function to handle the draft process
function Draft({ apiURL }) {
    
    // Extract draft ID from URL parameters
    const { draftId } = useParams();

    // Initialize location state to retrieve created draft from previous page
    const location = useLocation();
    const [draft, setDraft] = useState(location.state?.createdDraft || null);

    // Initialize navigate function from react-router
    const navigate = useNavigate();

    // Initialize state variable for responsive design
    const [isStacked, setIsStacked] = useState(window.innerWidth <= 1300);

    // Initialize state variables for players
    const [players, setPlayers] = useState([]);

    // Initialize state variables for draft picks
    const [picks, setPicks] = useState([]);

    // Initialize state variables for user-controlled teams
    const [userControlledTeams, setUserControlledTeams] = useState([]);
    const [teamDirectory, setTeamDirectory] = useState([]);
    const [referenceDraftPicks, setReferenceDraftPicks] = useState([]);
    
    // Initialize state variables for draft management
    const [isSelecting, setIsSelecting] = useState(false);
    const currentPickIndex = picks.findIndex(pick => !pick.player);
    const currentPick = currentPickIndex !== -1 ? picks[currentPickIndex] : null;
    const currentTeam = currentPick ? currentPick.team : null;

    const teamLookup = {};

    teamDirectory.forEach((team) => {
      if (team?.id) teamLookup[team.id] = team;
    });

    picks.forEach(pick => {
      if (pick.team) {
        teamLookup[pick.team.id] = pick.team;
      }

      if (pick.original_team) {
        teamLookup[pick.original_team.id] = pick.original_team;
      }
    });

  const [activeTradeTeam, setActiveTradeTeam] = useState(null);
  
  const tradeTeam =
  activeTradeTeam ||
  (userControlledTeams.length > 0
    ? teamLookup[userControlledTeams[0]]
    : null);

    const isUserTurn = currentPick && userControlledTeams.includes(currentPick.team.id);
    const [timeLeft, setTimeLeft] = useState(60);
    const [autoPickDelay, setAutoPickDelay] = useState(location.state?.autoPickDelay || 1400);
    const [draftMode] = useState(location.state?.draftMode || draft?.draft_mode || "standard");

    // Initialize state variables for draft tools
    const [toolsCollapsed, setToolsCollapsed] = useState(window.innerWidth <= 1300);
    const [pickToUndo, setPickToUndo] = useState(null);
    const [showTradeModal, setShowTradeModal] = useState(false);
    const [tradePartner, setTradePartner] = useState(null);
    const [tradedPicks, setTradedPicks] = useState({
        currentTeam: [],
        tradePartner: []
    });
    const [virtualPickOwners, setVirtualPickOwners] = useState({});
    const [tradeEvaluation, setTradeEvaluation] = useState(null);
    const [paused, setPaused] = useState(false);
    const [showConfirmUndoModal, setShowConfirmUndoModal] = useState(false);
    const [showConfirmRestartModal, setShowConfirmRestartModal] = useState(false);
    const [soundsMuted, setSoundsMuted] = useState(false);
    const [lastCpuDecision, setLastCpuDecision] = useState(null);
    const [tradeNotice, setTradeNotice] = useState(null);
    const tradeValueChart = {
  2025: {
    1: 3000, 2: 2600, 3: 2200, 4: 1800, 5: 1700, 6: 1600, 7: 1500, 8: 1400,
    9: 1350, 10: 1300, 11: 1250, 12: 1200, 13: 1150, 14: 1100, 15: 1050, 16: 1000,
    17: 950, 18: 900, 19: 875, 20: 850, 21: 800, 22: 780, 23: 760, 24: 740,
    25: 720, 26: 700, 27: 680, 28: 660, 29: 640, 30: 620, 31: 600, 32: 590,

    33: 580, 34: 560, 35: 550, 36: 540, 37: 530, 38: 520, 39: 510, 40: 500,
    41: 490, 42: 480, 43: 470, 44: 460, 45: 450, 46: 440, 47: 430, 48: 420,
    49: 410, 50: 400, 51: 390, 52: 380, 53: 370, 54: 360, 55: 350, 56: 340,
    57: 330, 58: 320, 59: 310, 60: 300, 61: 292, 62: 284, 63: 276, 64: 270,

    65: 265, 66: 260, 67: 255, 68: 250, 69: 245, 70: 240, 71: 235, 72: 230,
    73: 225, 74: 220, 75: 215, 76: 210, 77: 205, 78: 200, 79: 195, 80: 190,
    81: 185, 82: 180, 83: 175, 84: 170, 85: 165, 86: 160, 87: 155, 88: 150,
    89: 145, 90: 140, 91: 136, 92: 132, 93: 128, 94: 124, 95: 120, 96: 116,

    97: 112, 98: 108, 99: 104, 100: 100, 101: 96, 102: 92, 103: 88, 104: 86,
    105: 84, 106: 82, 107: 80, 108: 78, 109: 76, 110: 74, 111: 72, 112: 70,
    113: 68, 114: 66, 115: 64, 116: 62, 117: 60, 118: 58, 119: 56, 120: 54,
    121: 52, 122: 50, 123: 49, 124: 48, 125: 47, 126: 46, 127: 45, 128: 44,

    129: 43, 130: 42, 131: 41, 132: 40, 133: 39.5, 134: 39, 135: 38.5, 136: 38,
    137: 37.5, 138: 37, 139: 36.5, 140: 36, 141: 35.5, 142: 35, 143: 34.5, 144: 34,
    145: 33.5, 146: 33, 147: 32.6, 148: 32.2, 149: 31.8, 150: 31.4, 151: 31, 152: 30.6,
    153: 30.2, 154: 29.8, 155: 29.4, 156: 29, 157: 28.6, 158: 28.2, 159: 27.8, 160: 27.4,

    161: 27, 162: 26.6, 163: 26.2, 164: 25.8, 165: 25.4, 166: 25, 167: 24.6, 168: 24.2,
    169: 23.8, 170: 23.4, 171: 23, 172: 22.6, 173: 22.2, 174: 21.8, 175: 21.4, 176: 21,
    177: 20.6, 178: 20.2, 179: 19.8, 180: 19.4, 181: 19, 182: 18.6, 183: 18.2, 184: 17.8,
    185: 17.4, 186: 17, 187: 16.6, 188: 16.2, 189: 15.8, 190: 15.4, 191: 15, 192: 14.6,

    193: 14.2, 194: 13.8, 195: 13.4, 196: 13, 197: 12.6, 198: 12.2, 199: 11.8, 200: 11.4,
    201: 11, 202: 10.6, 203: 10.2, 204: 9.8, 205: 9.4, 206: 9, 207: 8.6, 208: 8.2,
    209: 7.8, 210: 7.4, 211: 7, 212: 6.6, 213: 6.2, 214: 5.8, 215: 5.4, 216: 5,
    217: 4.6, 218: 4.2, 219: 3.8, 220: 3.4, 221: 3, 222: 2.6, 223: 2.3, 224: 2
  }
};

    // Initialize state variables for position filtering and player search


    const getPickClockSeconds = (round) => {
      if (draftMode === "broadcast") {
        if (round === 1) return 10 * 60;
        if (round === 2) return 7 * 60;
        return 5 * 60;
      }
      if (draftMode === "express") return 30;
      if (draftMode === "auto") return 10;
      return 60;
    };

    const stableRuntimeHash = (value) => {
      const text = String(value || "");
      let hash = 2166136261;
      for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      return hash >>> 0;
    };

    const getCpuDelayForMode = (pick = currentPick) => {
      if (draftMode === "broadcast") {
        const round = pick?.draft_pick?.round || 1;
        const ranges = round === 1 ? [45000, 95000] : round === 2 ? [30000, 70000] : [20000, 55000];
        const seed = `${pick?.id || pick?.draft_pick?.pick_number || "pick"}|${pick?.team?.id || "team"}|${round}`;
        const normalized = stableRuntimeHash(seed) / 0xffffffff;
        return Math.round(ranges[0] + (ranges[1] - ranges[0]) * normalized);
      }
      if (draftMode === "express") return Math.min(autoPickDelay, 800);
      if (draftMode === "auto") return 250;
      return autoPickDelay;
    };

    const [positionFilter, setPositionFilter] = useState({value: "ALL", label: "ALL"});
    const positionOptions = [
        {value: "ALL", label: "ALL"}, 
        {value: "QB", label: "QB"},
        {value: "RB", label: "RB"},
        {value: "WR", label: "WR"},
        {value: "TE", label: "TE"},
        {value: "OT", label: "OT"},
        {value: "IOL", label: "IOL"},
        {value: "DE", label: "DE"},
        {value: "DT", label: "DT"},
        {value: "LB", label: "LB"},
        {value: "CB", label: "CB"},
        {value: "S", label: "S"},
    ];
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPlayerPreview, setSelectedPlayerPreview] = useState(null);
    const [isSearchHovered, setIsSearchHovered] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const filteredPlayers = [...players].filter(player => (positionFilter.value === "ALL" || player.position === positionFilter.value) && player.name.toLowerCase().includes(searchQuery.toLowerCase())).sort((a, b) => a.rank - b.rank);
const getProspectDecisionDisplay = (player) =>
  getSportsProspectDecisionDisplay(player);

const getProspectGrade = (player) =>
  getProspectDecisionDisplay(player)?.grade ?? null;

const getProspectTier = (player) =>
  getProspectDecisionDisplay(player)?.tier || "Pending";

const getProspectProjection = (player) =>
  getProspectDecisionDisplay(player)?.projection || "Pending";

    const teamPicks = currentTeam
  ? picks.filter(pick => pick.team.id === currentTeam.id)
  : [];

const getTradeAssets = (team) => {
  if (!team || !draft) return [];

  const existingPicks = picks.filter(pick => pick.team.id === team.id);
  const activeDraftPickIds = new Set(picks.map(pick => pick?.draft_pick?.id).filter(Boolean));

  // Build the current-year capital from the complete reference order, not
  // from mock_draft_picks. This keeps all seven rounds visible even when the
  // user is running a one-round mock.
  const referenceCurrentPicks = referenceDraftPicks
    .filter((pick) => pick.current_team_id === team.id && !activeDraftPickIds.has(pick.id))
    .map((pick) => {
      const pickId = `current-reference-${pick.id}`;
      const ownerTeam = virtualPickOwners[pickId] || team;
      return {
        id: pickId,
        referenceDraftPickId: pick.id,
        isReferenceCurrentPick: true,
        team: ownerTeam,
        draft_pick: {
          id: pick.id,
          round: pick.round,
          pick_number: pick.pick_number,
          year: pick.year,
        },
        player: null,
      };
    })
    .filter((pick) => pick.team?.id === team.id);

  // Fallback only if the complete reference order could not be loaded.
  const existingRounds = new Set(existingPicks.map(pick => pick.draft_pick.round));
  const generatedCurrentRounds = referenceDraftPicks.length
    ? []
    : [1, 2, 3, 4, 5, 6, 7].filter(round => round > draft.num_rounds);

  const missingCurrentPicks = generatedCurrentRounds
    .filter(round => !existingRounds.has(round))
    .map(round => {
      const pickId = `current-generated-${team.id}-${round}`;
      const ownerTeam = virtualPickOwners[pickId] || team;
      return {
        id: pickId,
        isGeneratedCurrentPick: true,
        team: ownerTeam,
        draft_pick: { round, pick_number: round * 32 },
        player: null,
      };
    })
    .filter(pick => pick.team?.id === team.id);

  const futurePicks = [1, 2, 3, 4, 5, 6, 7]
    .map(round => {
      const pickId = `future-${team.id}-${round}`;
      const ownerTeam = virtualPickOwners[pickId] || team;
      return {
        id: pickId,
        isFuturePick: true,
        team: ownerTeam,
        draft_pick: { round, pick_number: round * 32 },
        player: null,
      };
    })
    .filter(pick => pick.team?.id === team.id);

  const ownedVirtualPicks = Object.entries(virtualPickOwners)
    .filter(([, ownerTeam]) => ownerTeam?.id === team.id)
    .map(([pickId, ownerTeam]) => {
      const isFuturePick = pickId.startsWith("future-");
      const isReferenceCurrentPick = pickId.startsWith("current-reference-");
      const isGeneratedCurrentPick = pickId.startsWith("current-generated-");
      const referenceId = isReferenceCurrentPick ? Number(pickId.split("-").at(-1)) : null;
      const referencePick = isReferenceCurrentPick ? referenceDraftPicks.find((pick) => pick.id === referenceId) : null;
      const round = referencePick?.round ?? Number(pickId.split("-").at(-1));
      const pickNumber = referencePick?.pick_number ?? round * 32;
      return {
        id: pickId,
        isFuturePick,
        isReferenceCurrentPick,
        isGeneratedCurrentPick,
        team: ownerTeam,
        draft_pick: {
          id: referencePick?.id,
          round,
          pick_number: pickNumber,
          year: referencePick?.year,
        },
        player: null,
      };
    });

  const allAssets = [
    ...existingPicks,
    ...referenceCurrentPicks,
    ...missingCurrentPicks,
    ...futurePicks,
    ...ownedVirtualPicks,
  ];

  return Array.from(new Map(allAssets.map(asset => [asset.id, asset])).values())
    .sort((a, b) => {
      if (Boolean(a.isFuturePick) !== Boolean(b.isFuturePick)) return a.isFuturePick ? 1 : -1;
      return (a.draft_pick?.pick_number || 9999) - (b.draft_pick?.pick_number || 9999);
    });
};

const tradeTeamPicks = getTradeAssets(tradeTeam);

    // Initialize state variables for team management
    const teamPositionalNeeds = currentTeam ? Object.entries(currentTeam).filter(([key]) => key !== "name" && key !== "id" && key !== "year") : [];
    
    const getPositionUrgencyColor = (value) => {
        if (value >= 10) return '#9E1111';
        if (value === 9) return '#BA2626';
        if (value === 8) return '#C55555';
        if (value === 7) return '#E57373';
        if (value === 6) return '#F28B82';
        if (value === 5) return '#FAA199';
        if (value === 4) return '#A4CEAA';
        if (value === 3) return '#86C48F';
        if (value === 2) return '#58A263';
        if (value === 1) return '#3D8F40';
        return 'A5D6A7';
    };
    
    // Initialize refs for various elements and states
    const userInteractedRef = useRef(false);
    const initialPicksRef = useRef(null);
    const pickRefs = useRef({});
    const previousPickIdRef = useRef(null);
    const timerRef = useRef(null);
    const timeoutRef = useRef(null);
    const onTheClockRef = useRef(null);
    const onTheClockSoundRef = useRef(null);
    const draftPickSoundRef = useRef(null);
    const autoPickInProgressRef = useRef( {id: null, active: false} );

    // Fetch draft data when component mounts
    useEffect(() => {
        const fetchDraft = async () => {
            try {
                if (!draft) {
                    const draft_result = await axios.get(`${apiURL}/mock_drafts/${draftId}`);
                    setDraft(draft_result.data);
                }
            } catch (err) {
                console.error("Failed to load draft:", err);
            }
        };
        fetchDraft();
    }, [draftId]);

    // Fetch draft picks, user-controlled teams, and players when draft data is available
    useEffect(() => {
        const fetchRest = async() => {
            try {
                // Check if draft is loaded
                if (!draft) return;

                // Fetch draft picks and sort by pick number
                const referenceYear = Math.max(2026, Number(draft.year || 2026) - 1);
                const [picks_result, user_controlled_teams_result, players_result, teams_result, draft_capital_result] = await Promise.all([
                    axios.get(`${apiURL}/mock_draft_picks/${draftId}`),
                    axios.get(`${apiURL}/user_controlled_teams/${draftId}`),
                    axios.get(`${apiURL}/players/by_year/`, { params: { year: draft.year } }),
                    axios.get(`${apiURL}/teams/`, { params: { year: referenceYear, limit: 100 } }),
                    axios.get(`${apiURL}/draft_picks/`, { params: { year: referenceYear, limit: 300 } })
                ]);

                // Process picks
const picksData = Array.isArray(picks_result.data)
  ? picks_result.data
  : picks_result.data.picks || picks_result.data.data || [];

const sortedPicks = picksData
  .map(pick => ({
    ...pick,
    // Keep a permanent local copy of each pick's original owner.
    // This gives Restart Draft a reliable source of truth even after trades.
    original_team: pick.original_team || pick.team,
    original_team_id: pick.original_team?.id || pick.team?.id
  }))
  .sort((a, b) => {
    return a.draft_pick.pick_number - b.draft_pick.pick_number;
  });

if (!initialPicksRef.current) {
  initialPicksRef.current = sortedPicks.map(pick => ({
    ...pick,
    team: pick.original_team || pick.team,
    team_id: pick.original_team?.id || pick.team?.id,
    player: null,
    player_id: null
  }));
}

setPicks(sortedPicks);

// Process user-controlled teams
const userTeamsData = Array.isArray(user_controlled_teams_result.data)
  ? user_controlled_teams_result.data
  : user_controlled_teams_result.data.teams || user_controlled_teams_result.data.data || [];

setUserControlledTeams(userTeamsData.map(team => team.team_id));

// Keep an independent team directory so a user-controlled team remains
// selectable in Trade Center even when the current development prospect
// fixture materializes fewer draft picks than the requested draft length.
const teamsData = Array.isArray(teams_result.data)
  ? teams_result.data
  : teams_result.data.teams || teams_result.data.data || [];
setTeamDirectory(teamsData);

// Keep the complete seven-round reference draft capital independent from
// the number of rounds selected for this mock. The mock length controls
// which picks are simulated; it does not redefine a franchise's assets.
const draftCapitalData = Array.isArray(draft_capital_result.data)
  ? draft_capital_result.data
  : draft_capital_result.data.picks || draft_capital_result.data.data || [];
setReferenceDraftPicks(draftCapitalData);

// Process players
const playersData = Array.isArray(players_result.data)
  ? players_result.data
  : players_result.data.players || players_result.data.data || [];

const pickedPlayers = sortedPicks
  .filter(pick => pick.player)
  .map(pick => pick.player.id);

const availablePlayers = playersData.filter(player => !pickedPlayers.includes(player.id));
const draftablePlayers = buildDraftableProspectPool(availablePlayers, { draftYear: draft.year });

setPlayers(draftablePlayers);
            } catch (err) {
                console.error("Failed to fetch additional data:", err);
            }
        };
        fetchRest();
    }, [draft]);

    // Handle window resize for responsive design
    useEffect(() => {
  let lastStacked = window.innerWidth <= 1300;
  setToolsCollapsed(lastStacked);
  const handleResize = () => {
    const stacked = window.innerWidth <= 1300;
    if (stacked !== lastStacked) {
      setToolsCollapsed(stacked);
      lastStacked = stacked;
    }
    setIsStacked(stacked);
  };
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);

    // Scroll to the next pick on the clock when picks change
    useEffect(() => {
        // Check if there is a next pick without a player
        const nextPickIndex = picks.findIndex(p => !p.player);

        // If there is a next pick and the on-the-clock ref is set, scroll to it
        if (nextPickIndex !== -1 && onTheClockRef.current) {
            // Set the on-the-clock ref to the next pick element
            const pickElement = onTheClockRef.current;
            const container = document.querySelector(".draft_picks");

            // If the pick element and container exist, scroll to the pick element
            if (pickElement && container) {
                const containerRect = container.getBoundingClientRect();
                const pickRect = pickElement.getBoundingClientRect();
                const scrollOffset = pickRect.left - containerRect.left + 2;

                container.scrollBy({
                    left: scrollOffset,
                    behavior: "smooth"
                });
            }
        }
    }, [picks]);

    // Redirect to results page if all picks are made
    useEffect(() => {
        // Check if all picks have a player assigned
        const allPicked = picks.length > 0 && picks.every(p => p.player);
        if (allPicked) {
            navigate(`/results/${draftId}`);
        }
    }, [picks, draftId])

    // Initialize audio elements for draft sounds
    useEffect(() => {
        // Create audio elements for draft pick selection and on-the-clock sounds
        draftPickSoundRef.current = new Audio("/sounds/draft_pick.mp3");
        draftPickSoundRef.current.preload = "auto";
        draftPickSoundRef.current.playbackRate = 1.5;
        onTheClockSoundRef.current = new Audio("/sounds/on_the_clock.mp3");
        onTheClockSoundRef.current.preload = "auto";
    }, []);

    // Handle timer for current pick
    useEffect(() => {
        // Check if there is a current pick and if it has a team
        if (!currentPick || !currentPick.team) {
            return;
        }

        // Check if the current pick is assigned to a user-controlled team and if it is different from the previous pick
        const isUserPick = userControlledTeams.includes(currentPick.team.id);
        if (currentPick.id !== previousPickIdRef.current) {
            setTimeLeft(getPickClockSeconds(currentPick?.draft_pick?.round || 1));

            if (isUserPick && !soundsMuted && userInteractedRef.current && onTheClockSoundRef.current) {
                onTheClockSoundRef.current.currentTime = 0;
                setTimeout(() => {
                    onTheClockSoundRef.current.play();
                }, 1000);
            }

            previousPickIdRef.current = currentPick.id;
        }

        // Clear any existing timer or timeout
        clearInterval(timerRef.current);
        clearTimeout(timeoutRef.current);

        autoPickInProgressRef.current = {id: null, active: false};

        // If the draft is paused, do not start a new timer
        if (paused) {
            return;
        }

        const shouldRunVisibleClock = isUserPick || draftMode === "broadcast";
        if (shouldRunVisibleClock) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (paused) {
                        clearInterval(timerRef.current);
                        return prev;
                    }

                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        if (!autoPickInProgressRef.current.active) {
                            handleAutoSelectPlayer(currentPick);
                        }
                        return 0;
                    }

                    return prev - 1;
                });
            }, 1000);
        }

        if (!isUserPick && !currentPick.player && players.length > 0) {
            timeoutRef.current = setTimeout(() => {
                if (!autoPickInProgressRef.current.active) {
                    handleAutoSelectPlayer(currentPick);
                }
            }, getCpuDelayForMode(currentPick));
        }

        // Cleanup function to clear the timer when component unmounts or dependencies change
        return () => {
            clearInterval(timerRef.current);
            clearTimeout(timeoutRef.current);
        };
    }, [currentPick?.id, currentPick, players.length, userControlledTeams, paused, draftMode, autoPickDelay]);

    // Handle user interaction to enable sounds
    useEffect(() => {
        // If user has not interacted yet, add event listeners to enable sounds
        const handleUserInteraction = () => {
            userInteractedRef.current = true;
            window.removeEventListener("click", handleUserInteraction);
            window.removeEventListener("keydown", handleUserInteraction);
        };
        window.addEventListener("click", handleUserInteraction);
        window.addEventListener("keydown", handleUserInteraction);

        return () => {
            window.removeEventListener("click", handleUserInteraction);
            window.removeEventListener("keydown", handleUserInteraction);
        };
    }, []);

    // Load draft data if not already loaded
    useEffect(() => {
      if (!tradeNotice) return undefined;
      const timeout = window.setTimeout(() => setTradeNotice(null), 5000);
      return () => window.clearTimeout(timeout);
    }, [tradeNotice]);

    if (!draft) {
        return <div>Loading draft...</div>;
    }

    // Handle manual player selection
    const handleSelectPlayer = async (selectedPlayer) => {
        // Pause freezes the clock and automatic/CPU progression only.
        // A user-controlled team may still submit its selection while paused.
        if (isSelecting) {
            return;
        } else if (!currentPick) {
            alert("No pick is currently on the clock.");
            return;
        } else if (!userControlledTeams.includes(currentPick.team.id)) {
            alert("You do not control this team.");
            return;
        }
        
        // Check if sounds are muted and if draft pick sound is available
        if (!soundsMuted && draftPickSoundRef.current) {
            draftPickSoundRef.current.pause();
            draftPickSoundRef.current.currentTime = 0;
            setTimeout(() => {
                draftPickSoundRef.current.play().catch(() => {});
            }, 50);
        }

        setIsSelecting(true);

        // Select player for current pick
        try {
            // Wait for player to be selected
            await axios.put(`${apiURL}/mock_draft_picks/${currentPick.id}`, {
                player_id: selectedPlayer.id
            });

            // Update current pick with selected player and remove player from big board
            const updatedPick = {...currentPick, player: selectedPlayer};
            setPicks(prevPicks => prevPicks.map(pick => pick.id === updatedPick.id ? updatedPick : pick));
            setPlayers(prevPlayers => prevPlayers.filter(player => player.id !== selectedPlayer.id));
        } catch (err) {
            console.error("Failed to select player: ", err);
            alert("An error occurred while selecting the player. Please try again.");
        }
        
        setIsSelecting(false);
    }

    // Handle player auto-selection through the Sports Intelligence Engine.
    // Draft.jsx owns runtime mechanics only; football judgment belongs to the engine layer.
    const handleAutoSelectPlayer = async (pick) => {
        if (!pick || pick.player) {
            autoPickInProgressRef.current = {id: null, active: false};
            return;
        } else if (autoPickInProgressRef.current.active && autoPickInProgressRef.current.id === pick.id) {
            return;
        }

        autoPickInProgressRef.current = {id: pick.id, active: true};

        const decisionTeamPicks = picks.filter((entry) => entry?.team?.id === pick?.team?.id);
        const draftDecision = resolveSportsDraftDecision({
            players,
            team: pick.team,
            pick,
            teamPicks: decisionTeamPicks,
        });
        const selectedPlayer = draftDecision?.recommendation?.player || null;

        setLastCpuDecision(draftDecision);

        if (!selectedPlayer) {
            console.warn("Sports Intelligence Engine returned no CPU draft recommendation.", draftDecision);
            autoPickInProgressRef.current = {id: null, active: false};
            return;
        }

        try {
            await axios.put(`${apiURL}/mock_draft_picks/${pick.id}`, {
                player_id: selectedPlayer.id
            });

            const updatedPick = {...pick, player: selectedPlayer};
            setPicks(prevPicks => prevPicks.map(entry => (entry.id === updatedPick.id ? updatedPick : entry)));
            setPlayers(prevPlayers => prevPlayers.filter(player => player.id !== selectedPlayer.id));
        } catch (err) {
            console.error("Failed to auto-select player: ", err);
        } finally {
            autoPickInProgressRef.current = {id: null, active: false};
        }
    };

    // Handle undo pick action
    const initiateUndoPick = () => {
        // Find the most recent completed pick
        const lastCompletedPickIndex = [...picks].reverse().findIndex(pick => pick.player);

        // Check if there are any completed picks
        if (lastCompletedPickIndex === -1) {
            alert("No picks have been made yet.");
            return;
        }

        // Set pick to undo based on last completed pick
        const indexToUndo = picks.length - 1 - lastCompletedPickIndex;
        setPickToUndo(picks[indexToUndo]);
        setShowConfirmUndoModal(true);
    };

    // Handle confirm undo pick action
    const confirmUndoPick = async () => {
        // Wait for user confirmation before proceeding with undo
        try {
            // Remove player for pick to undo
            await axios.put(`${apiURL}/mock_draft_picks/${pickToUndo.id}`, { player_id: null });

            // Add player back to the big board and update picks
            setPlayers(prev => [...prev, pickToUndo.player].sort((a, b) => a.rank - b.rank));
            setPicks(prev => prev.map(pick => pick.id === pickToUndo.id ? {...pick, player: null, player_id: null} : pick));
        } catch (err) {
            console.error("Failed to undo pick: ", err);
            alert("An error occurred while undoing the pick. Please try again.");
        } finally {
            setShowConfirmUndoModal(false);
            setPickToUndo(null);
        }
    };

    // Handle cancel undo pick action
    const cancelUndoPick = () => {
        setShowConfirmUndoModal(false);
        setPickToUndo(null);
    };

    // Display all possible trade partners
    // const getTradePartnerOptions = () => {
    //     return [...new Set(picks.map(pick => pick.team))].filter(team => team.id !== currentTeam.id).map(team => ({ value: team.id, label: team.name, team }));
    // };

    const getTradePartnerOptions = () => {
        const teamsById = {};
        picks.forEach(pick => {
            if (pick.team && pick.team.id !== tradeTeam?.id) {
                teamsById[pick.team.id] = pick.team;
            }
        });
        return Object.values(teamsById).map(team => ({
            value: team.id,
            label: team.name,
            team,
        }));
    };

    // Handle trade partner selection
    const handleSelectTradePartner = (selectedOption) => {
        const selectedTeam = selectedOption?.team || null;
        setTradePartner(selectedTeam);
        setTradedPicks(prev => ({ ...prev, tradePartner: [] }));
        setTradeEvaluation(null);
    };

    // Handle pick selection for trades
    const togglePickSelection = (teamSide, pickId) => {
        // Update traded picks for specified team
        setTradedPicks(prev => {
            const currentSelectedIds = prev[teamSide];
            const updated = {
                ...prev,
                [teamSide]: currentSelectedIds.includes(pickId) ? currentSelectedIds.filter(id => id !== pickId) : [...currentSelectedIds, pickId]
            };

            const allTradeAssets = [
  ...getTradeAssets(tradeTeam),
  ...(tradePartner ? getTradeAssets(tradePartner) : [])
];

const picksDataFromIds = (pickIds) =>
  allTradeAssets.filter(pick => pickIds.includes(pick.id));

            // Update trade state for both teams
            const team1Picks = picksDataFromIds(updated.currentTeam);
            const team2Picks = picksDataFromIds(updated.tradePartner);

            // Evaluate trade if there are picks selected for both teams
            if (team1Picks.length > 0 && team2Picks.length > 0) {
                const evaluation = evaluateTrade(team1Picks, team2Picks, tradeValueChart);
                setTradeEvaluation(evaluation);
            } else {
                setTradeEvaluation(null);
            }

            return updated;
        });
    };

    // Evaluate trade based on selected picks and trade value chart
    // Evaluate trade using Trade AI Engine v1
const evaluateTrade = (userPicks, cpuPicks, tradeValueChart) => {
  const getPickValue = (pick) => {
    if (!pick?.draft_pick) return 0;

    if (pick.isFuturePick) {
      const futurePickValues = {
        1: 40,
        2: 72,
        3: 112,
        4: 152,
        5: 190,
        6: 225,
        7: 255,
      };

      const discountedPickNumber = futurePickValues[pick.draft_pick.round];
      return tradeValueChart[2025]?.[discountedPickNumber] || 0;
    }

    return tradeValueChart[2025]?.[pick.draft_pick.pick_number] || 0;
  };

  const sumValues = picks =>
    picks.reduce((sum, pick) => sum + getPickValue(pick), 0);

  const userGivesValue = sumValues(userPicks);
  const cpuGivesValue = sumValues(cpuPicks);

  const userBestPick = Math.min(
    ...userPicks
      .filter(pick => !pick.isFuturePick)
      .map(pick => pick.draft_pick.pick_number)
  );

  const cpuBestPick = Math.min(
    ...cpuPicks
      .filter(pick => !pick.isFuturePick)
      .map(pick => pick.draft_pick.pick_number)
  );

  const userMovesUp =
    Number.isFinite(userBestPick) &&
    Number.isFinite(cpuBestPick) &&
    cpuBestPick < userBestPick;

  const cpuMovesUp =
    Number.isFinite(userBestPick) &&
    Number.isFinite(cpuBestPick) &&
    userBestPick < cpuBestPick;

  const difference = Math.abs(userGivesValue - cpuGivesValue);
  const largerTotal = Math.max(userGivesValue, cpuGivesValue);
  const percentDifference = largerTotal === 0 ? 100 : (difference / largerTotal) * 100;

  let verdict = "Rejected";
  let acceptedByCpu = false;

  if (userMovesUp && userGivesValue <= cpuGivesValue) {
    verdict = "Rejected";
    acceptedByCpu = false;
  } else if (userMovesUp && userGivesValue > cpuGivesValue) {
    const overpayPercent = ((userGivesValue - cpuGivesValue) / cpuGivesValue) * 100;

    if (overpayPercent >= 4) {
      verdict = "CPU Favored";
      acceptedByCpu = true;
    } else {
      verdict = "User Favored";
      acceptedByCpu = false;
    }
  } else if (cpuMovesUp && cpuGivesValue <= userGivesValue) {
    verdict = "Rejected";
    acceptedByCpu = false;
  } else if (cpuMovesUp && cpuGivesValue > userGivesValue) {
    verdict = "CPU Favored";
    acceptedByCpu = true;
  } else if (percentDifference <= 5) {
    verdict = "Fair";
    acceptedByCpu = true;
  } else if (userGivesValue > cpuGivesValue) {
    verdict = "CPU Favored";
    acceptedByCpu = true;
  } else if (cpuGivesValue > userGivesValue && percentDifference <= 7) {
    verdict = "Acceptable";
    acceptedByCpu = true;
  } else {
    verdict = "Rejected";
    acceptedByCpu = false;
  }

  console.log("Trade AI Evaluation:", {
    userGivesValue,
    cpuGivesValue,
    userBestPick,
    cpuBestPick,
    userMovesUp,
    cpuMovesUp,
    difference,
    percentDifference,
    verdict,
    acceptedByCpu,
  });

  return {
    team1Total: userGivesValue,
    team2Total: cpuGivesValue,
    userGivesValue,
    cpuGivesValue,
    userBestPick,
    cpuBestPick,
    userMovesUp,
    cpuMovesUp,
    difference,
    percentDifference,
    verdict,
    acceptedByCpu,
  };
};

    // Handle trade submission
    const submitTrade = () => {
  if (tradedPicks.currentTeam.length === 0 || tradedPicks.tradePartner.length === 0) {
    alert("Please select at least one pick from each team to trade.");
    return;
  }

  if (!tradeEvaluation) {
    alert("Please select picks from both teams before submitting a trade.");
    return;
  }

  if (!tradeEvaluation.acceptedByCpu) {
    alert(`Trade rejected by the ${tradePartner.name}. Verdict: ${tradeEvaluation.verdict}`);
    return;
  }

  setPicks(prevPicks =>
    prevPicks.map(pick => {
      if (tradedPicks.currentTeam.includes(pick.id)) {
        return {
          ...pick,
          team: tradePartner,
          team_id: tradePartner.id
        };
      }

      if (tradedPicks.tradePartner.includes(pick.id)) {
        return {
          ...pick,
          team: tradeTeam,
          team_id: tradeTeam.id
        };
      }

      return pick;
    })
  );

  setVirtualPickOwners(prev => {
    const updated = { ...prev };

    tradedPicks.currentTeam.forEach(pickId => {
      if (
        String(pickId).startsWith("future-") ||
        String(pickId).startsWith("current-generated-") ||
        String(pickId).startsWith("current-reference-")
      ) {
        updated[pickId] = tradePartner;
      }
    });

    tradedPicks.tradePartner.forEach(pickId => {
      if (
        String(pickId).startsWith("future-") ||
        String(pickId).startsWith("current-generated-") ||
        String(pickId).startsWith("current-reference-")
      ) {
        updated[pickId] = tradeTeam;
      }
    });

    return updated;
  });

  const acceptedTradeNotice = {
    id: Date.now(),
    title: "Trade accepted",
    message: `${tradeTeam?.name || "Your team"} and ${tradePartner?.name || "the trade partner"} agreed to the deal.`,
  };
  setTradeNotice(acceptedTradeNotice);

  setShowTradeModal(false);
  setTradePartner(null);
  setTradedPicks({
    currentTeam: [],
    tradePartner: []
  });
  setTradeEvaluation(null);
  setTimeLeft(getPickClockSeconds(currentPick?.draft_pick?.round || 1));
  setPaused(false);
};

    // Handle restart draft confirmation
    const confirmRestartDraft = async () => {
        const resetPicks = (initialPicksRef.current || picks).map(pick => {
            const originalTeam = pick.original_team || pick.team;

            return {
                ...pick,
                player: null,
                player_id: null,
                team: originalTeam,
                team_id: originalTeam?.id
            };
        });

        setVirtualPickOwners({});
        setTradePartner(null);
        setActiveTradeTeam(null);
        setTradedPicks({
            currentTeam: [],
            tradePartner: []
        });
        setTradeEvaluation(null);
        setShowTradeModal(false);
        setPaused(false);
        setTimeLeft(getPickClockSeconds(currentPick?.draft_pick?.round || 1));
        setPickToUndo(null);
        setShowConfirmUndoModal(false);

        setPicks(resetPicks);

        // Also reset the backend so a browser refresh does not bring traded picks back.
        try {
            await Promise.allSettled(
                resetPicks
                    .filter(pick => !String(pick.id).startsWith("future-") && !String(pick.id).startsWith("current-generated-") && !String(pick.id).startsWith("current-reference-"))
                    .map(pick =>
                        axios.put(`${apiURL}/mock_draft_picks/${pick.id}`, {
                            player_id: null,
                            team_id: pick.team_id
                        })
                    )
            );
        } catch (err) {
            console.error("Failed to fully reset draft picks:", err);
        }

        try {
            const players_result = await axios.get(`${apiURL}/players/by_year/`, {
                params: { year: draft.year }
            });

            const playersData = Array.isArray(players_result.data)
                ? players_result.data
                : players_result.data.players || players_result.data.data || [];

            setPlayers(
                buildDraftableProspectPool(playersData, { draftYear: draft.year })
                    .sort((a, b) => a.rank - b.rank)
            );
        } catch (err) {
            console.error("Failed to fetch players:", err);
        }

        setShowConfirmRestartModal(false);
    };

    // Styling for position filter dropdown
    const positionFilterStyles = {
        control: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused || state.menuIsOpen ? '#264653' : '#68CABE',
            borderColor: 'black',
            borderWidth: '2px',
            borderRadius: '8px',
            boxShadow:'4px 4px 0 black',
            minHeight: '36px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            '&:hover': {
                backgroundColor: '#264653',
            },
        }), 
        menu: (base) => ({
            ...base,
            backgroundColor: '#264653',
            border: '2px solid black',
            borderRadius: '8px',
            boxShadow: '4px 4px 0 black',
            marginTop: '8px',
            zIndex: 10
        }), 
        menuList: (base) => ({
            ...base,
            borderRadius: '8px',
            paddingTop: 0,
            paddingBottom: 0,
        }),
        option: (base, state) => ({
            ...base,
            fontWeight: state.isSelected ? 700 : state.isFocused ? 500 : 400,
            backgroundColor: state.isSelected ? '#264643' : state.isFocused ? '#92AFAC' : 'white',
            color: state.isSelected ? 'white' : '#222',
            padding: '8px 12px',
            cursor: 'pointer'
        }),
        singleValue: (base, state) => ({
            ...base,
            color: state.isFocused || state.menuIsOpen ? 'white' : 'black',
            fontWeight: 700,
        }),
        dropdownIndicator: (base, state) => ({
            ...base,
            color: state.isFocused || state.menuIsOpen ? 'white' : 'black',
        }),
    };
    const positionFilterTheme = (theme) => ({
        ...theme,
        borderRadius: 8,
        colors: {
            ...theme.colors,
            primary: '#264643',
            primary25: '#92AFAC', // hover background
            neutral0: '#264653', // control background
            neutral20: 'black', // control border
            neutral80: '#EDF2F4', // control text
        },
    });


    const undoLatestPick = async () => {
      const latestPick = [...picks].reverse().find((pick) => pick.player);
      if (!latestPick) {
        alert("No picks have been made yet.");
        return;
      }

      if (!window.confirm(`Undo ${latestPick.player.name} to ${latestPick.team.name}?`)) return;

      try {
        await axios.put(`${apiURL}/mock_draft_picks/${latestPick.id}`, { player_id: null });
        setPlayers((previous) => [...previous, latestPick.player].sort((a, b) => a.rank - b.rank));
        setPicks((previous) => previous.map((pick) => pick.id === latestPick.id ? { ...pick, player: null, player_id: null } : pick));
      } catch (error) {
        console.error("Failed to undo pick:", error);
        alert("An error occurred while undoing the pick. Please try again.");
      }
    };

    // Render draft operations center
    return (
      <>
        <DraftOperationsCenter
          draft={draft}
          picks={picks}
          players={players}
          filteredPlayers={filteredPlayers}
          allPlayers={players}
          currentPick={currentPick}
          currentTeam={currentTeam}
          userControlledTeams={userControlledTeams}
          teamDirectory={teamDirectory}
          paused={paused}
          timeLeft={timeLeft}
          autoPickDelay={autoPickDelay}
          soundsMuted={soundsMuted}
          positionFilter={positionFilter}
          positionOptions={positionOptions}
          searchQuery={searchQuery}
          selectedPlayer={selectedPlayerPreview}
          isSelecting={isSelecting}
          onSelectPlayer={handleSelectPlayer}
          onPreviewPlayer={setSelectedPlayerPreview}
          onPositionFilterChange={setPositionFilter}
          onSearchChange={setSearchQuery}
          onPause={() => setPaused((previous) => !previous)}
          onUndo={undoLatestPick}
          onTrade={() => {
            setActiveTradeTeam(tradeTeam);
            setShowTradeModal(true);
            setPaused(true);
          }}
          onRestart={() => {
            if (window.confirm("Restart this draft and clear every selection?")) confirmRestartDraft();
          }}
          onAutoPickDelayChange={setAutoPickDelay}
          onToggleSound={() => setSoundsMuted((previous) => !previous)}
          draftMode={draftMode}
          onSimCpuPick={() => {
            if (currentPick && !isUserTurn && !autoPickInProgressRef.current.active) {
              handleAutoSelectPlayer(currentPick);
            }
          }}
          getProspectGrade={getProspectGrade}
          getProspectTier={getProspectTier}
          getProspectProjection={getProspectProjection}
          cpuDecision={lastCpuDecision}
          getTeamDraftCapital={getTradeAssets}
        />

        {tradeNotice ? (
          <div className="draft-trade-toast" role="status" aria-live="polite">
            <div className="draft-trade-toast-icon" aria-hidden="true">✓</div>
            <div>
              <strong>{tradeNotice.title}</strong>
              <span>{tradeNotice.message}</span>
            </div>
            <button type="button" onClick={() => setTradeNotice(null)} aria-label="Dismiss trade notification">×</button>
          </div>
        ) : null}

        {showTradeModal && (
          <TradeOperationsCenter
            draft={draft}
            tradeTeam={tradeTeam}
            tradePartner={tradePartner}
            yourTeamOptions={userControlledTeams
              .map((teamId) => teamLookup[teamId])
              .filter(Boolean)
              .map((team) => ({ value: team.id, label: team.name, team }))
              .sort((a, b) => a.label.localeCompare(b.label))}
            partnerOptions={getTradePartnerOptions().sort((a, b) => a.label.localeCompare(b.label))}
            yourAssets={tradeTeamPicks.filter((pick) => !pick.player)}
            partnerAssets={tradePartner ? getTradeAssets(tradePartner).filter((pick) => !pick.player) : []}
            selectedYourAssets={tradedPicks.currentTeam}
            selectedPartnerAssets={tradedPicks.tradePartner}
            evaluation={tradeEvaluation}
            onSelectYourTeam={(option) => {
              const selectedTeam = option?.team || null;
              setActiveTradeTeam(selectedTeam);
              setTradePartner(null);
              setTradedPicks({ currentTeam: [], tradePartner: [] });
              setTradeEvaluation(null);
            }}
            onSelectPartner={handleSelectTradePartner}
            onToggleYourAsset={(pickId) => togglePickSelection("currentTeam", pickId)}
            onTogglePartnerAsset={(pickId) => togglePickSelection("tradePartner", pickId)}
            onSubmit={submitTrade}
            onCancel={() => {
              setShowTradeModal(false);
              setTradePartner(null);
              setTradedPicks({ currentTeam: [], tradePartner: [] });
              setTradeEvaluation(null);
              setPaused(false);
            }}
          />
        )}
      </>
    );
}

export default Draft;
