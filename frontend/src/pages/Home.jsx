/* 
    * Home page component. Handles mock draft creation and team selection.
*/


// Import necessary libraries and hooks
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import LBHTCard from "../components/ui/LBHTCard";
import HomeHero from "../components/home/HomeHero";
import DraftSettingsCard from "../components/home/DraftSettingsCard";
import DraftConfigurationPanel from "../components/home/DraftConfigurationPanel";
import TeamSelectionPanel from "../components/home/TeamSelectionPanel";
import IntelligenceCenter from "../components/home/IntelligenceCenter";


// Function to handle the draft creation process
function Home({ apiURL }) {
    // Define API URL from environment variable
    
    // Initialize navigate function from react-router
    const navigate = useNavigate();

    // Initialize state variables for draft settings
    const [name, setName] = useState("");
    const [numRounds, setNumRounds] = useState(1);
    const [year, setYear] = useState(2026);
    const [autoPickDelay, setAutoPickDelay] = useState(1000);
    const [soundsMuted, setSoundsMuted] = useState(false);
    const [yearDropdownInteracted, setYearDropdownInteracted] = useState(false);

    // Initialize state variables for team selection
    const [teamsLoading, setTeamsLoading] = useState(true);
    const [teamsError, setTeamsError] = useState("");
    const [teams, setTeams] = useState([]);
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [showSelectTeamModal, setShowSelectTeamModal] = useState(false);

    // Initialize state variables for draft creation status
    const [loading, setLoading] = useState(false);
    const [loadingStartTime, setLoadingStartTime] = useState(null);
    const [dots, setDots] = useState("");
    const [error, setError] = useState("");

    // Initialize state for dark mode (commented out for now)
    const [darkMode, setDarkMode] = useState(false);
    
    // Fetch teams from the API when the component mounts
    useEffect(() => {
        const fetchTeams = async () => {
            setTeamsLoading(true);
            setTeamsError("");
            setLoadingStartTime(Date.now());

            try {
                // Create an abort controller for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => {
                    controller.abort();
                }, 45000); // 45 second timeout

                const response = await axios.get(`${apiURL}/teams`, {
                    params: { year: year },
                    signal: controller.signal,
                    timeout: 45000,
                    headers: {
                        "Cache-Control": "no-cache",
                        "Pragma": "no-cache",
                    }
                });
                
                clearTimeout(timeoutId);

const teamsData = Array.isArray(response.data)
  ? response.data
  : response.data.teams || response.data.data || [];

setTeams(teamsData);

const loadTime = Date.now() - loadingStartTime;
console.log(`Teams loaded in ${loadTime}ms`);

            } catch (err) {
                console.error("Failed to fetch teams", err);

                if (err.name === "AbortError" || err.code === "ECONNABORTED") {
                    setTeamsError("Server is starting up (this can take up to 60 seconds on first visit). Please wait...");
                } else if (err.response?.status >= 500) {
                    setTeamsError("Server error. Please refresh the page.");
                } else {
                    setTeamsError("Failed to fetch teams. Please check your connection and try again.");
                }
            } finally {
                setTeamsLoading(false);
            }
        };

        fetchTeams();
    }, [apiURL, year]);

    useEffect(() => {
        if (loading) {
            const interval = setInterval(() => {
                setDots(prev => prev.length < 3 ? prev + "." : "");
            }, 500);

            return () => clearInterval(interval);
        } else {
            setDots("");
        }
    }, [loading]);

    // useEffect(() => {
    //     if (darkMode) {
    //         document.documentElement.classList.add("dark_mode");
    //     } else {
    //         document.documentElement.classList.remove("dark_mode");
    //     }
    // }, [darkMode]);

    // Handle team selection toggle
    const handleToggleTeam = (teamId) => {
        setSelectedTeams((prev) => prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]);
    };

    // Handle select all/deselect all teams
    const handleSelectAll = () => {
        if (selectedTeams.length === teams.length) {
            setSelectedTeams([]);
        } else {
            setSelectedTeams(teams.map((team) => team.id));
        }
    };

const handleResetSettings = () => {
  setName("");
  setNumRounds(1);
  setYear(2026);
  setAutoPickDelay(1400);
  setSelectedTeams([]);
  setYearDropdownInteracted(false);
};

    // Handle draft creation
    const handleStartDraft = async () => {
        
        setLoading(true);
        setError("");

        try {
            // Create new mock draft with selected settings
            const result = await axios.post(`${apiURL}/mock_drafts/bootstrap`, {
                name: name || "Mock Draft",
                num_rounds: numRounds,
                year: year,
                user_team_ids: selectedTeams
            });
            const createdDraft = result.data;

            // Navigate to the created draft page with the created draft data
            navigate(`/draft/${createdDraft.id}`, { state: { createdDraft, autoPickDelay } });
        } catch (err) {
            setError("Failed to create mock draft.");
        } finally {
            setLoading(false);
        }
    };

    // Render home page
    return (
        <div className="draft_center_setup">
  <HomeHero logoSrc="/site/Monogram.svg" />

            <main className="home_main">
  <section className="home_top_row">
                                
                <DraftConfigurationPanel
  year={year}
  setYear={setYear}
  setSelectedTeams={setSelectedTeams}
  setYearDropdownInteracted={setYearDropdownInteracted}
  autoPickDelay={autoPickDelay}
  setAutoPickDelay={setAutoPickDelay}
  numRounds={numRounds}
  setNumRounds={setNumRounds}
  loading={loading}
  dots={dots}
  error={error}
  onStartDraft={handleStartDraft}
  onResetSettings={handleResetSettings}
/>

                <TeamSelectionPanel
  teams={teams}
  selectedTeams={selectedTeams}
  teamsLoading={teamsLoading}
  teamsError={teamsError}
  onToggleTeam={handleToggleTeam}
  onSelectAll={handleSelectAll}
/>
  </section>

  <IntelligenceCenter />

</main>
        </div>
    );
}

export default Home;