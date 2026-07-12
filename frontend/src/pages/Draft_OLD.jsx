/* 
    * Draft page component. Handles draft process, including player selection, trades, and team management.
*/


// Import necessary libraries and components
import React from "react";
import { useState, useEffect, useRef } from "react";
import { useLocation, useParams, useNavigate, Link } from "react-router-dom";
import Select from "react-select";
import axios from "axios";
import { getTeamAIProfile } from "../engines/TeamProfiles";
import { getPositionValue } from "../engines/PositionValues";
import { getNeedMultiplier } from "../engines/TeamNeeds";
import { buildTeamDraftBoard } from "../engines/DraftBoardEngine";
import { evaluatePlayer } from "../engines/PlayerEvaluationEngine";

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
    
    // Initialize state variables for draft management
    const [isSelecting, setIsSelecting] = useState(false);
    const currentPickIndex = picks.findIndex(pick => !pick.player);
    const currentPick = currentPickIndex !== -1 ? picks[currentPickIndex] : null;
    const currentTeam = currentPick ? currentPick.team : null;

    const teamLookup = {};

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
    const [autoPickDelay, setAutoPickDelay] = useState(location.state?.autoPickDelay || 1000);

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
const selectedPlayerEvaluation = selectedPlayerPreview
  ? evaluatePlayer(selectedPlayerPreview)
  : null;

    const teamPicks = currentTeam
  ? picks.filter(pick => pick.team.id === currentTeam.id)
  : [];

const getTradeAssets = (team) => {
  if (!team || !draft) return [];

  const existingPicks = picks.filter(pick => pick.team.id === team.id);

  const existingRounds = new Set(
    existingPicks.map(pick => pick.draft_pick.round)
  );

  const generatedCurrentRounds = [1, 2, 3, 4, 5, 6, 7].filter(
    round => round > draft.num_rounds
  );

const missingCurrentPicks = generatedCurrentRounds
  .filter(round => !existingRounds.has(round))
  .map(round => {
    const pickId = `current-generated-${team.id}-${round}`;
    const ownerTeam = virtualPickOwners[pickId] || team;

    return {
      id: pickId,
      isGeneratedCurrentPick: true,
      team: ownerTeam,
      draft_pick: {
        round,
        pick_number: round * 32,
      },
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
      draft_pick: {
        round,
        pick_number: round * 32,
      },
      player: null,
    };
  })
  .filter(pick => pick.team?.id === team.id);

  const ownedVirtualPicks = Object.entries(virtualPickOwners)
  .filter(([pickId, ownerTeam]) => ownerTeam?.id === team.id)
  .map(([pickId, ownerTeam]) => {
    const parts = pickId.split("-");
    const round = Number(parts[parts.length - 1]);
    const isFuturePick = pickId.startsWith("future-");

    return {
      id: pickId,
      isFuturePick,
      isGeneratedCurrentPick: pickId.startsWith("current-generated-"),
      team: ownerTeam,
      draft_pick: {
        round,
        pick_number: round * 32,
      },
      player: null,
    };
  });

const allAssets = [
  ...existingPicks,
  ...missingCurrentPicks,
  ...futurePicks,
  ...ownedVirtualPicks
];

const uniqueAssets = Array.from(
  new Map(allAssets.map(asset => [asset.id, asset])).values()
);

return uniqueAssets;

  
};

const tradeTeamPicks = getTradeAssets(tradeTeam);

    // Initialize state variables for team management
    const teamPositionalNeeds = currentTeam ? Object.entries(currentTeam).filter(([key, value]) => key !== "name" && key !== "id" && key !== "year") : [];
    
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
                const [picks_result, user_controlled_teams_result, players_result] = await Promise.all([
                    axios.get(`${apiURL}/mock_draft_picks/${draftId}`),
                    axios.get(`${apiURL}/user_controlled_teams/${draftId}`),
                    axios.get(`${apiURL}/players/by_year/`, { params: { year: draft.year } })
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

// Process players
const playersData = Array.isArray(players_result.data)
  ? players_result.data
  : players_result.data.players || players_result.data.data || [];

const pickedPlayers = sortedPicks
  .filter(pick => pick.player)
  .map(pick => pick.player.id);

const availablePlayers = playersData.filter(player => !pickedPlayers.includes(player.id));

setPlayers(availablePlayers);
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
        if (isUserPick && currentPick.id !== previousPickIdRef.current) {
            // Reset timer to 60 seconds
            setTimeLeft(60);

            // Play on-the-clock sound if user has interacted and sounds are not muted
            if (!soundsMuted && userInteractedRef.current && onTheClockSoundRef.current) {
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

        // Check if user is making the pick
        if (isUserPick) {
            // If current pick is a user pick, start a countdown timer
            timerRef.current = setInterval(() => {
                // Update time left every second
                setTimeLeft(prev => {
                    // If paused, clear the timer and return previous value
                    if (paused) {
                        clearInterval(timerRef.current);
                        return prev;
                    }

                    // if time has run out, clear the timer and auto-select player
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        if (!autoPickInProgressRef.current.active) {
                            handleAutoSelectPlayer(currentPick);
                        }
                        return 0;
                    }

                    return prev - 1;
                });
            }, 1000); // Update every second
        } else if (!currentPick.player && players.length > 0) {
            // If current pick is not a user pick and there are available players, auto-select a player after a delay
            timeoutRef.current = setTimeout(() => {
                if (!autoPickInProgressRef.current.active) {
                    handleAutoSelectPlayer(currentPick);
                }
            }, autoPickDelay);
        }

        // Cleanup function to clear the timer when component unmounts or dependencies change
        return () => {
            clearInterval(timerRef.current);
            clearTimeout(timeoutRef.current);
        };
    }, [currentPick?.id, currentPick, players.length, userControlledTeams, paused]);

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
    if (!draft) {
        return <div>Loading draft...</div>;
    }

    // Handle manual player selection
    const handleSelectPlayer = async (selectedPlayer) => {
        // Check if already selecting a player, if draft is paused, if there is no current pick, or if the current pick does not belong to a user-controlled team
        if (isSelecting) {
            return;
        } else if (paused) {
            alert("Draft is paused. Please resume before selecting a player.");
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

    // Handle player auto-selection
    const handleAutoSelectPlayer = async (pick) => {
        // Check if there is no current pick, the current pick has already been selected, or if auto-pick is already in progress
        if (!pick || pick.player) {
            autoPickInProgressRef.current = {id: null, active: false};
            return;
        } else if (autoPickInProgressRef.current.active && autoPickInProgressRef.current.id === pick.id) {
            return;
        }

        autoPickInProgressRef.current = {id: pick.id, active: true};

        const teamAIProfile = getTeamAIProfile(pick.team);

        // Retrieve current team's positional needs and calculate urgency
        const teamNeeds = {};
        if (pick.team) {
            Object.entries(pick.team).forEach(([position, urgency]) => {
                if (position !== "id" && position !== "name") {
                    teamNeeds[position.toLowerCase()] = 1 + urgency * 0.2;
                }
            });
        }

        // Check which positions have already been drafted by the current team
        const positionsDrafted = new Set(teamPicks.filter(pick => pick.player).map(pick => pick.player.position.toLowerCase()));
        
        // Gather top candidates from big board based on draft round
        const basePoolSize = pick.draft_pick.round >= 4 ? 40 : 20;
const bpaBoost = teamAIProfile.bpaPreference >= 8 ? 8 : 0;
const aggressionBoost = teamAIProfile.aggression >= 8 ? 5 : 0;
const poolSize = basePoolSize + bpaBoost + aggressionBoost;
        const candidates = players.slice(0, poolSize);

        const teamDraftBoard = buildTeamDraftBoard({
  players: candidates,
  team: pick.team,
  pick,
  positionsDrafted,
});

       const selectedPlayer = teamDraftBoard[0];

        if (selectedPlayer) {
            try {
                await axios.put(`${apiURL}/mock_draft_picks/${pick.id}`, {
                    player_id: selectedPlayer.id
                });

                const updatedPick = {...pick, player: selectedPlayer};
                setPicks(prevPicks => prevPicks.map(pick => (pick.id === updatedPick.id ? updatedPick : pick)));
                setPlayers(prevPlayers => prevPlayers.filter(player => player.id !== selectedPlayer.id));
            } catch (err) {
                console.error("Failed to auto-select player: ", err);
            } finally {
                autoPickInProgressRef.current = {id: null, active: false};
            }
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
        setTradePartner(selectedOption.team);
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
        String(pickId).startsWith("current-generated-")
      ) {
        updated[pickId] = tradePartner;
      }
    });

    tradedPicks.tradePartner.forEach(pickId => {
      if (
        String(pickId).startsWith("future-") ||
        String(pickId).startsWith("current-generated-")
      ) {
        updated[pickId] = tradeTeam;
      }
    });

    return updated;
  });

  setShowTradeModal(false);
  setTradePartner(null);
  setTradedPicks({
    currentTeam: [],
    tradePartner: []
  });
  setTradeEvaluation(null);
  setTimeLeft(60);
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
        setTimeLeft(60);
        setPickToUndo(null);
        setShowConfirmUndoModal(false);

        setPicks(resetPicks);

        // Also reset the backend so a browser refresh does not bring traded picks back.
        try {
            await Promise.allSettled(
                resetPicks
                    .filter(pick => !String(pick.id).startsWith("future-") && !String(pick.id).startsWith("current-generated-"))
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

            setPlayers(playersData.sort((a, b) => a.rank - b.rank));
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


    // Render draft page
    return (
        <div className="draft_container">
            <header className="draft_header">
                <Link to="/" className="logo_link">
                    <img
                        src="/site/icon_logo.png"
                        alt="NFL Mock Draft Simulator logo"
                        className="draft_logo" 
                    />
                </Link>

                {currentPick && (
                    <div className={`pick_timer ${timeLeft <= 10 ? "urgent" : ""} ${isUserTurn ? "" : "cpu_turn"}`}>
                        <span>
                            {isUserTurn ? `${timeLeft}s` : "CPU"}
                        </span>
                    </div>
                )}
                
                <div className="draft_picks_wrapper">
                    <div className="draft_picks">
                        {picks.length === 0 ? (
                            <div className="picks_loading_message">
                                Loading picks
                                <span className="dot_animate"></span>
                            </div>
                        ) : (
                            picks.map((pick, index) => {
                                if (index === currentPickIndex) {
                                    return (
                                        <React.Fragment key={pick.id + "-with-header"}>
                                            <p ref={onTheClockRef} className="on_the_clock_header">
                                                On the
                                                <br />
                                                Clock
                                            </p>

                                            <div ref={el => pickRefs.current[pick.id] = el} className={`draft_pick on_the_clock`}>
                                                <div className="pick_team_logo_wrapper">
                                                    <img
                                                        src={`/logos/nfl/${pick.team.name.toLowerCase()}.png`}
                                                        alt={pick.team.name}
                                                        className="pick_team_logo"
                                                    />
                                                </div>

                                                <div className="pick_text_wrapper">
                                                    <div className="pick_team_name">
                                                        {pick.team.name}
                                                    </div>
                                                </div>

                                                <div className="pick_label">
                                                    {userControlledTeams.includes(pick.team.id) && !pick.player &&
                                                        (<small className="user_controlled_team_label">User</small>)
                                                    }

                                                    <small>
                                                        {pick.draft_pick.round}.{pick.draft_pick.pick_number}
                                                    </small>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                }

                                return (
                                    <div
                                        key={pick.id}
                                        ref={el => pickRefs.current[pick.id] = el}
                                        className={`draft_pick ${pick.player ? "picked" : "future"}`}
                                    >
                                        <div className="pick_team_logo_wrapper">
                                            <img
                                                src={`/logos/nfl/${pick.team.name.toLowerCase()}.png`}
                                                alt={pick.team.name}
                                                className="pick_team_logo"
                                            />
                                        </div>

                                        <div className="pick_text_wrapper">
                                            <div className={`pick_team_name ${pick.player ? 'picked' : ''}`}>
                                                {pick.team.name}
                                            </div>

                                            {pick.player && (
                                                <div className="pick_selected_player">{pick.player.name}</div>
                                            )}
                                        </div>

                                        <div className="pick_label">
                                            {userControlledTeams.includes(pick.team.id) && !pick.player &&
                                                (<small className="user_controlled_team_label">User</small>)
                                            }

                                            <small className="pick_badge">
                                                {pick.draft_pick.round}.{pick.draft_pick.pick_number}
                                            </small>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </header>

            <main className="draft_main">
                <aside className={`draft_tools ${toolsCollapsed ? "collapsed" : ""}`}>
                    <div
                        className="draft_tools_header"
                        onClick={() => {
                            if (isStacked) setToolsCollapsed(prev => !prev);
                        }}
                        style={{
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <div></div>
                        <h2
                            style={{
                                margin: 0,
                            }}
                        >
                            Draft Tools
                        </h2>
                        <div>
                            <span className={`chevron ${toolsCollapsed ? "collapsed" : ""}`}>
                                {toolsCollapsed ? "▼" : "▲"}
                            </span>
                        </div>
                    </div>

                    <div>
                        {!toolsCollapsed && (
                            <>
                                <div className="draft_tools_buttons">
                                    <button className="draft_tool" onClick={initiateUndoPick}>
                                        Undo Pick
                                    </button>
                                    <button className="draft_tool" onClick={() => {
                                        setActiveTradeTeam(tradeTeam);
					setShowTradeModal(true);
                                        setPaused(true);
                                    }}>
                                        Trade Pick
                                    </button>
                                    <button className="draft_tool" onClick={() => setPaused(prev => !prev)}>
                                        {paused ? "Resume" : "Pause"} Draft
                                    </button>
                                    <button className="draft_tool" onClick={() => setShowConfirmRestartModal(true)}>
                                        Restart Draft
                                    </button>
                                </div>

                                {showConfirmUndoModal && (
                                    <div className="confirm_undo_modal">
                                        <div className="confirm_undo_modal_content">
                                            <p className="confirm_undo_modal_message">
                                                Undo pick {pickToUndo?.draft_pick.round}.{pickToUndo?.draft_pick.pick_number}?
                                            </p>
                                            <p className="confirm_undo_modal_pick">
                                                {pickToUndo?.player.name} selected by {pickToUndo?.team.name}
                                            </p>
                                            <div className="confirm_undo_modal_buttons">
                                                <button className="confirm_undo_modal_btn confirm" onClick={confirmUndoPick}>Yes</button>
                                                <button className="confirm_undo_modal_btn cancel" onClick={cancelUndoPick}>No</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {showTradeModal && (
                                    <div className="trade_modal">
                                        <div className="trade_modal_content">
                                            <div className="trade_modal_header">
                                                <h2>Trade Picks</h2>
                                                <Select
  						  className="trade_team_dropdown"
  						  options={userControlledTeams
    						    .map(teamId => teamLookup[teamId])
    						    .filter(Boolean)
    						    .map(team => ({
      						      value: team.id,
      						      label: team.name,
      						      team
   						    }))}
  						  onChange={(selectedOption) => {
    						    setActiveTradeTeam(selectedOption.team);
    						    setTradePartner(null);
    						    setTradedPicks({
      						      currentTeam: [],
      						      tradePartner: []
    						    });
    						    setTradeEvaluation(null);
  						  }}
  						  placeholder="Select Your Team"
						/>
						<Select
                                                    className="trade_team_dropdown"
                                                    options={getTradePartnerOptions()}
                                                    onChange={handleSelectTradePartner}
                                                    placeholder="Select Trade Partner" 
                                                />
                                            </div>

                                            <div className="trade_columns">
                                                <div className="trade_team_column">
                                                    <div className="trade_team">
                                                        <div className="trade_team_logo_wrapper">
                                                            <img
                                                                src={`/logos/nfl/${tradeTeam?.name.toLowerCase()}.png`}
                                                                alt={tradeTeam?.name}
                                                                className="trade_team_logo"
                                                            />
                                                        </div>

                                                        <div className="trade_team_name">
                                                            {tradeTeam?.name}
                                                        </div>
                                                    </div>

                                                    <div className="trade_picks">
  						      {tradeTeamPicks
    							.filter(pick => !pick.player)
    							.map(pick => (
      							  <button
        						    key={pick.id}
        						    className={`trade_pick_btn ${tradedPicks.currentTeam.includes(pick.id) ? "selected" : ""}`}
        						    onClick={() => togglePickSelection("currentTeam", pick.id)}
      							  >
        						    {pick.isFuturePick
         						      ? `${draft.year + 1} R${pick.draft_pick.round}`
          						      : `R${pick.draft_pick.round} P${pick.draft_pick.pick_number}`
       							    }
      							  </button>
   						        ))}
						    </div>
                                                </div>

                                                <div className="trade_team_column">
                                                    {tradePartner && (
                                                        <>
                                                            <div className="trade_team">
                                                                <div className="trade_team_logo_wrapper">
                                                                    <img
                                                                        src={`/logos/nfl/${tradePartner.name.toLowerCase()}.png`}
                                                                        alt={tradePartner.name}
                                                                        className="trade_team_logo"
                                                                    />
                                                                </div>

                                                                <div className="trade_team_name">
                                                                    {tradePartner.name}
                                                                </div>
                                                            </div>

                                                            <div className="trade_picks">
                                                                {getTradeAssets(tradePartner)
    								  .filter(pick => !pick.player)
    								  .map(pick => (
                                                                    <button
                                                                        key={pick.id}
                                                                        className={`trade_pick_btn ${tradedPicks.tradePartner.includes(pick.id) ? "selected" : ""}`}
                                                                        onClick={() => togglePickSelection("tradePartner", pick.id)}
                                                                    >
                                                                        {pick.isFuturePick
    									    ? `${draft.year + 1} R${pick.draft_pick.round}`
                                                                            : `R${pick.draft_pick.round} P${pick.draft_pick.pick_number}`
                                                                        }
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {tradeEvaluation && (
                                                <div className="trade_evaluation">
                                                    <div
                                                        className={`trade_evaluation_bar ${tradeEvaluation.verdict.toLowerCase()}`}
                                                        style={{
                                                            transform: tradeEvaluation.verdict === "Fair" ? "translateX(0)" : tradeEvaluation.team1Total > tradeEvaluation.team2Total ? `translateX(${tradeEvaluation.percentDifference}%)` : `translateX(${-tradeEvaluation.percentDifference}%)`
                                                        }}
                                                        title={`Trade Verdict: ${tradeEvaluation.verdict}`}
                                                    >
                                                        {tradeEvaluation.verdict}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="trade_modal_buttons">
                                                <button className="trade_modal_btn submit" onClick={submitTrade}>
                                                    Submit Trade
                                                </button>
                                                <button className="trade_modal_btn cancel" onClick={() => {
                                                    setShowTradeModal(false);
                                                    setTradePartner(null);
                                                    setTradedPicks({
                                                        currentTeam: [],
                                                        tradePartner: []
                                                    });
                                                    setTradeEvaluation(null);
                                                    setPaused(false);
                                                }}>
                                                    Cancel Trade
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {showConfirmRestartModal && (
                                    <div className="confirm_restart_modal">
                                        <div className="confirm_restart_modal_content">
                                            <p className="confirm_restart_modal_message">
                                                Restart draft?
                                            </p>
                                            
                                            <div className="confirm_restart_modal_buttons">
                                                <button className="confirm_restart_modal_btn confirm" onClick={confirmRestartDraft}>
                                                    Yes
                                                </button>
                                                <button className="confirm_restart_modal_btn cancel" onClick={() => setShowConfirmRestartModal(false)}>
                                                    No
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="draft_details">
                                    <h3>
                                        Details
                                    </h3>
                                    <br />
                                    <p>
                                        <strong>Name</strong>
                                    </p>
                                    <p>
                                        {draft.name}
                                    </p>
                                    <br />
                                    <p>
                                        <strong>Year</strong>
                                    </p>
                                    <p>
                                        {draft.year}
                                    </p>
                                    <br />
                                    <p>
                                        <strong>Rounds</strong>
                                    </p>
                                    <p>
                                        {draft.num_rounds}
                                    </p>
                                    <br />

                                    <div className="auto_pick_speed_wrapper">
                                        <label className="auto_pick_speed_label">
                                            Pick Speed
                                        </label>
                                        <div className="auto_pick_speed_slider_container">
                                            <input
                                                className="auto_pick_speed_slider"
                                                type="range"
                                                min={200}
                                                max={5000}
                                                step={100}
                                                value={5200 - autoPickDelay}
                                                onChange={(e) => setAutoPickDelay(5200 - parseInt(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        className={`mute_btn_wrapper ${soundsMuted ? "muted" : "unmuted"}`}
                                        onClick={() => setSoundsMuted(prev => !prev)}
                                    >
                                        <img
                                            src={soundsMuted ? "/site/unmute.svg" : "/site/mute.svg"}
                                            alt={soundsMuted ? "Unmute" : "Mute"}
                                            className="mute_btn"
                                        />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </aside>

                <section className="big_board">

                    <div className="draft_command_center">
  {currentPick && currentTeam ? (
    <>
      <div className="command_team_logo_wrapper">
        <img
          src={`/logos/nfl/${currentTeam.name.toLowerCase()}.png`}
          alt={currentTeam.name}
          className="command_team_logo"
        />
      </div>

      <div className="command_pick_details">
        <p className="command_label">ON THE CLOCK</p>
        <h2>{currentTeam.name}</h2>
        <p>
          Pick {currentPick.draft_pick.round}.{currentPick.draft_pick.pick_number}
        </p>
        <p className={isUserTurn ? "command_user_turn" : "command_cpu_turn"}>
          {isUserTurn ? `${timeLeft}s remaining` : "CPU is making the pick"}
        </p>
      </div>

      <div className="command_actions">
        <button
          className="command_action_btn"
          onClick={() => setPaused(prev => !prev)}
        >
          {paused ? "Resume" : "Pause"}
        </button>

        <button
          className="command_action_btn"
          onClick={() => {
            setActiveTradeTeam(tradeTeam);
            setShowTradeModal(true);
            setPaused(true);
          }}
          disabled={!isUserTurn}
        >
          Trade
        </button>
      </div>
    </>
  ) : (
    <p>Loading draft command center...</p>
  )}
</div>

{selectedPlayerPreview && selectedPlayerEvaluation && (
  <div className="player_preview_panel">
    <div className="player_preview_header">
      <div>
        <p className="player_preview_label">PLAYER PREVIEW</p>
        <h3>{selectedPlayerPreview.name}</h3>
      </div>

      <button
        className="player_preview_close"
        onClick={() => setSelectedPlayerPreview(null)}
      >
        ×
      </button>
    </div>

    <div className="player_preview_meta">
      <span>{selectedPlayerPreview.position}</span>
      <span>{selectedPlayerPreview.college}</span>
      <span>Rank #{selectedPlayerPreview.rank}</span>
    </div>

    <div className="player_preview_intel_grid">
      <div className="player_preview_intel_card">
        <span className="intel_label">Grade</span>
        <strong>{selectedPlayerEvaluation.estimatedGrade}</strong>
      </div>

      <div className="player_preview_intel_card">
        <span className="intel_label">Tier</span>
        <strong>{selectedPlayerEvaluation.tier}</strong>
      </div>

      <div className="player_preview_intel_card">
        <span className="intel_label">Archetype</span>
        <strong>{selectedPlayerEvaluation.archetype}</strong>
      </div>

      <div className="player_preview_intel_card">
        <span className="intel_label">Projection</span>
        <strong>{selectedPlayerEvaluation.draftProjection}</strong>
      </div>
    </div>

{selectedPlayerEvaluation?.traitSummary?.available ? (
  <div className="player_preview_traits_section">
    <div className="player_preview_section_header">
      Player Intelligence
    </div>

    <div className="player_preview_traits_list">
      {Object.entries(selectedPlayerEvaluation.traits || {}).map(
        ([traitName, traitScore]) => (
          <div className="player_preview_trait_row" key={traitName}>
            <span className="player_preview_trait_name">
              {traitName}
            </span>
            <span className="player_preview_trait_score">
              {traitScore}
            </span>
          </div>
        )
      )}
    </div>

    <div className="player_preview_trait_confidence">
      Confidence: {Math.round((selectedPlayerEvaluation.traitConfidence || 0) * 100)}%
    </div>
  </div>
) : (
  <div className="player_preview_traits_section player_preview_traits_empty">
    <div className="player_preview_section_header">
      Player Intelligence
    </div>

    <p>Trait profile coming soon.</p>
  </div>
)}

    <div className="player_preview_scouting">
      <div>
        <p className="intel_label">Strengths</p>
        <ul>
          {(selectedPlayerEvaluation.strengths || []).slice(0, 3).map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      <div>
        <p className="intel_label">Weaknesses</p>
        <ul>
          {(selectedPlayerEvaluation.weaknesses || []).slice(0, 3).map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  </div>
)}

                    <div className="big_board_header">
                        <div className="big_board_left">
                            <Select
                                className="position_filter"
                                classNamePrefix="select"
                                options={positionOptions}
                                value={positionFilter}
                                onChange={setPositionFilter}
                                isSearchable={false}
                                styles={positionFilterStyles} theme={positionFilterTheme}
                            />
                        </div>

                        <div className="big_board_center">
                            <h2>League Big Board</h2>
                        </div>

                        <div className="big_board_right">
                            <div className="player_search_wrapper">
                                <input
                                    type="text"
                                    placeholder={isSearchFocused || isSearchHovered ? "Search players by name" : "Search"}
                                    className="player_search_input"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setIsSearchFocused(false)}
                                    onMouseEnter={() => setIsSearchHovered(true)}
                                    onMouseLeave={() => setIsSearchHovered(false)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="players">
                        {filteredPlayers.length === 0 ? (
                            <div className="players_loading_message">
                                Loading players
                                <span className="dot_animate"></span>
                            </div>
                        ) : (
                            filteredPlayers.map(player => (
                                <div
  key={player.id}
  className={`player ${selectedPlayerPreview?.id === player.id ? "preview_selected" : ""}`}
  onClick={() => setSelectedPlayerPreview(player)}
>
                                    <div className="player_college_logo_wrapper">
                                        <img
                                            src={`/logos/college/${player.college.replaceAll(" ", "_")}.png`}
                                            alt={player.college}
                                            className="player_college_logo"
                                        />
                                    </div>

                                    <div className="player_details">
                                        <span className="player_name">
                                            {player.name}
                                        </span>
                                        <span className="player_background">
                                            {player.college}
                                        </span>
                                    </div>

                                    <div className="player_label">
                                        <small className="player_position">
                                            {player.position}
                                        </small>

                                        <small className="player_rank">
                                            {player.rank}
                                        </small>
                                    </div>

                                    <div className="select_player">
                                        <button
                                            className="select_player_btn"
                                            onClick={() => handleSelectPlayer(player)}
                                            disabled={isSelecting || !isUserTurn || timeLeft === 0}
                                        >
                                            Select
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <aside className="team_profile">
                    {currentTeam ? (
                        <div className="team">
                            <div className="team_profile_header war_room_header">
  <div className="war_room_label">WAR ROOM</div>

  <div className="team_profile_identity">
    <div className="team_profile_logo_wrapper">
      <img
        src={`/logos/nfl/${currentTeam.name.toLowerCase()}.png`}
        alt={currentTeam.name}
        className="team_profile_logo"
      />
    </div>

    <h2 className="team_name">
      {currentTeam.name}
    </h2>
  </div>
</div>

                            <div className="team_positional_needs_grid">
                                <h3 className="team_positional_needs_header">
                                    Positional Needs
                                    <span className="positional_needs_info_icon" tabIndex="0">
                                        ⓘ
                                        <span className="positional_needs_tooltip_text">
                                            Each position is scored from 1 (low need) to 10 (high need). Color-coded by urgency from dark green (1) to dark red (10), with lighter shades in between. Based on team-specific roster evaluations.
                                        </span>
                                    </span>
                                </h3>

                                <div className="positional_needs_row offensive_need">
                                    {teamPositionalNeeds.slice(0, 6).map(([position, value]) => (
                                        <div
                                            key={position}
                                            className="position_box"
                                            style={{ backgroundColor: getPositionUrgencyColor(value) }}
                                        >
                                            <span className="position_label">
                                                {position.toUpperCase()}
                                            </span>

                                            <span className="position_value">
                                                {value}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="positional_needs_row defensive_need">
                                    {teamPositionalNeeds.slice(6).map(([position, value]) => (
                                        <div
                                            key={position}
                                            className="position_box"
                                            style={{ backgroundColor: getPositionUrgencyColor(value) }}
                                        >
                                            <span className="position_label">
                                                {position.toUpperCase()}
                                            </span>

                                            <span className="position_value">
                                                {value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="team_picks_list">
                                <h3 className="team_picks_list_header">
                                    Picks
                                </h3>
                                
                                <div className="team_picks">
                                    {teamPicks.map((pick, index) => (
                                        <div key={index} className={`team_pick ${pick.id === currentPick?.id ? "current_team_pick" : ""}`}>
                                            <span className="pick_info">
                                                {pick.draft_pick.round}.{pick.draft_pick.pick_number}
                                            </span>

                                            {pick.player ? (
                                                <span className="pick_player">
                                                    <strong>{pick.player.name}</strong>
                                                    <br /> {pick.player.position} - {pick.player.college}
                                                </span>
                                            ) : (
                                                <span className="pick_empty">
                                                    Not picked yet
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="team_picks_list_spacer"></div>
                        </div>
                    ) : (
                        <div className="team_loading_message">
                            Loading team
                            <span className="dot_animate"></span>
                        </div>
                    )}
                </aside>
            </main>
        </div>
    );
}

export default Draft;