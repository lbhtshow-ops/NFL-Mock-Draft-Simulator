/* 
    * Results page component. Displays draft results and allows exporting in various formats.
*/


// Import necessary libraries and hooks
import React from "react";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import html2canvas from "html2canvas";


// Function to handle the draft results display
function Results({ apiURL }) {
   
    // Extract draft ID from URL parameters
    const { draftId } = useParams();

    // Initialize navigate function from react-router
    const navigate = useNavigate();

    // Initialize state variables for draft data
    const [draft, setDraft] = useState(null);
    const [picks, setPicks] = useState([]);
    const [teams, setTeams] = useState([]);
    const [userControlledTeams, setUserControlledTeams] = useState([]);
    const rounds = Array.from(new Set(picks.map(pick => pick.draft_pick.round))).sort((a, b) => a - b);
    const picksByRound = rounds.map(round => picks.filter(pick => pick.draft_pick.round === round));

    // Initialize state variables for results display
    const[activeTab, setActiveTab] = useState("full");
    const [fullDraftView, setFullDraftView] = useState("list");
    const [currentRoundIndex, setCurrentRoundIndex] = useState(0);

    // Initialize refs for various elements and states
    const resultsRef = useRef(null);
    
    // Redirect to home page when new draft is started
    const handleNewDraft = () => {
        navigate("/");
    };

    // Export draft results to CSV file
    const exportToCSV = () => {
        // Export picks based on active tab
        const exportPicks = activeTab === "full" ? picks : picks.filter(pick => pick.team.id === activeTab);
        const csvRows = [["Round", "Pick", "Team", "Player", "Position", "College", "Rank"]];
        exportPicks.forEach(pick => {
            csvRows.push([
                pick.draft_pick.round,
                pick.draft_pick.pick_number,
                pick.team.name,
                pick.player.name,
                pick.player.position,
                pick.player.college,
                pick.player.rank
            ]);
        });

        // Create CSV content
        const csvContent = csvRows.map(row => row.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);

        // Trigger download
        const filename = `${draft?.name?.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") || "draft"}_results${activeTab === "full" ? "" : `_${teams.find(team => team.team.id === activeTab).team.name.toLowerCase().replace(/\s+/g, "_")}`}.csv`;
        link.setAttribute("download", filename);
        link.click();
        URL.revokeObjectURL(url);
    };

    // Export draft results to JSON file
    const exportToJSON = () => {
        // Export picks based on active tab
        const exportPicks = activeTab === "full" ? picks : picks.filter(pick => pick.team.id === activeTab);
        const simplifiedData = exportPicks.map(pick => ({
            round: pick.draft_pick.round,
            pick: pick.draft_pick.pick_number,
            team: pick.team.name,
            player: pick.player.name,
            position: pick.player.position,
            college: pick.player.college,
            rank: pick.player.rank
        }));

        // Create JSON content
        const jsonString = JSON.stringify(simplifiedData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);

        // Trigger download
        const filename = `${draft?.name?.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") || "draft"}_results${activeTab === "full" ? "" : `_${teams.find(team => team.team.id === activeTab).team.name.toLowerCase().replace(/\s+/g, "_")}`}.json`;
        link.setAttribute("download", filename);
        link.click();
        URL.revokeObjectURL(url);
    };

    // Export draft results to PNG image
    const exportToPNG = () => {
        // Check if there are results to export
        if (!resultsRef.current) {
            alert("Nothing to export.");
            return;
        }

        // Use html2canvas to capture the results section
        html2canvas(resultsRef.current, { scale: 2 }).then(canvas => {
            // Create blob from canvas
            canvas.toBlob(blob => {
                if (!blob) {
                    alert("Failed to generate image.");
                    return;
                }

                // Create link to download blob as an image
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);

                // Trigger download
                const filename = `${draft?.name?.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") || "draft"}_results${activeTab === "full" ? "" : `_${teams.find(team => team.team.id === activeTab).team.name.toLowerCase().replace(/\s+/g, "_")}`}.png`;
                link.setAttribute("download", filename);
                link.click();
                URL.revokeObjectURL(url);
            }, "image/png");
        }).catch(err => {
            console.error("html2canvas error: ", err);
            alert("Failed to generate image. Please try again.");
        });
    };

    // Handle sharing the current page link
    const handleShareLink = async () => {
        try {
            // Wait for clipboard permissions and write the current URL to clipboard
            await navigator.clipboard.writeText(window.location.href);

            // Show toast notification for successful copy
            const toast = document.getElementById("share_toast");
            toast.classList.remove("hidden");
            toast.classList.add("show");

            setTimeout(() => {
                toast.classList.remove("show");
                setTimeout(() => toast.classList.add("hidden"), 300);
            }, 2000);
        } catch (err) {
            console.error("Failed to copy link to clipboard: ", err);
        }
    }

    // Fetch draft data and picks when component mounts
    useEffect(() => {
        const fetchData = async () => {
            // Fetch picks, user-controlled teams, and draft details from the API
            const [picksResponse, userControlledTeamsResponse, draftResponse] = await Promise.all([
                axios.get(`${apiURL}/mock_draft_picks/${draftId}`),
                axios.get(`${apiURL}/user_controlled_teams/${draftId}`),
                axios.get(`${apiURL}/mock_drafts/${draftId}`)
            ]);

		console.log("PICKS RESPONSE:", picksResponse.data);
		console.log("USER TEAMS RESPONSE:", userControlledTeamsResponse.data);
		console.log("DRAFT RESPONSE:", draftResponse.data);
            

            // Sort picks by round and pick number
const picksData = Array.isArray(picksResponse.data)
  ? picksResponse.data
  : picksResponse.data.picks || picksResponse.data.data || [];

const picks = picksData.sort((a, b) => {
  if (a.draft_pick.round !== b.draft_pick.round) {
    return a.draft_pick.round - b.draft_pick.round;
  }
  return a.draft_pick.pick_number - b.draft_pick.pick_number;
});

            // Collect picks for each user-controlled team
            const userTeamsData = Array.isArray(userControlledTeamsResponse.data)
  ? userControlledTeamsResponse.data
  : userControlledTeamsResponse.data.teams || userControlledTeamsResponse.data.data || [];

const userControlledTeams = userTeamsData.map(team => team.team_id);
            const teamsMap = {};
            picks.forEach(pick => {
                const teamId = pick.team.id;
                if (!userControlledTeams.includes(teamId)) return;
                
                if (!teamsMap[teamId]) {
                    teamsMap[teamId] = {
                        team: pick.team,
                        picks: []
                    };
                }
                teamsMap[teamId].picks.push(pick);
            });

            setPicks(picks);
            setTeams(Object.values(teamsMap));
            setUserControlledTeams(userControlledTeams);
            setDraft(draftResponse.data);
        };
        fetchData();
    }, [draftId]);

    // Render results page
    return (
        <div className="results_container">
            <header className="results_header">
                <Link to="/" className="logo_link">
                    <img
                        src="/site/alternate_logo.png"
                        alt="NFL Mock Draft Simulator logo"
                        className="results_logo"
                    />
                </Link>

                <h1>Draft Results</h1>

                <div id="share_toast" className="share_toast hidden">
                    Link copied to clipboard!
                </div>

                <div className="results_header_right">
                    <button className="share_btn_wrapper" onClick={handleShareLink}>
                        <img
                            src="/site/share.svg"
                            alt="Share"
                            className="share_btn"
                        />
                    </button>

                    <div className="results_draft_buttons">
                        <button className="results_draft_btn" onClick={handleNewDraft}>
                            New Draft
                        </button>
                        <button className="results_draft_btn" onClick={exportToPNG}>
                            Export as PNG
                        </button>
                        {/* <button className="export_draft_btn">Export as PDF</button> */}
                        <button className="results_draft_btn" onClick={exportToCSV}>
                            Export as CSV
                        </button>
                        <button className="results_draft_btn" onClick={exportToJSON}>
                            Export as JSON
                        </button>
                    </div>
                </div>
            </header>
            
            <main className="results_main" ref={resultsRef}>
                <section className={activeTab === "full" && fullDraftView === "grid" ? "results_box grid" : "results_box"}>
                    <div className="results_tabs">
                        <div className={`tab ${activeTab === "full" ? "active" : ""}`} onClick={() => setActiveTab("full")}>
                            FULL DRAFT
                        </div>

                        {teams.map(({ team }) => (
                            <div
                                key={team.id}
                                className={`tab ${activeTab === team.id ? "active" : ""}`}
                                onClick={() => setActiveTab(team.id)}
                            >
                                {team.name}
                            </div>
                        ))}
                    </div>

                    <div className="results_content">
                        <div className={activeTab === "full" && fullDraftView === "grid" ? "results_grid" : "results_list"}>
                            {picks.length === 0 ? (
                                <div className="results_loading_message">
                                    Loading results
                                    <span className="dot_animate"></span>
                                </div>
                            ) : activeTab === "full" && fullDraftView === "list" ? (
                                (() => {
                                    let currentRound = null;
                                    return picks.map((pick, index) => {
                                        const roundChanged = pick.draft_pick.round !== currentRound;
                                        currentRound = pick.draft_pick.round;

                                        return (
                                            <React.Fragment key={pick.id}>
                                                {roundChanged && (
                                                    <div className="round_divider">
                                                        Round {pick.draft_pick.round}
                                                    </div>
                                                )}

                                                <div className="results_pick">
                                                    <div className="results_pick_logo_wrapper">
                                                        <img
                                                            src={`/logos/nfl/${pick.team.name.toLowerCase()}.png`}
                                                            alt={pick.team.name}
                                                            className="results_pick_logo"
                                                        />
                                                    </div>

                                                    <div className="results_pick_details">
                                                        <span className="results_pick_number">
                                                            {pick.draft_pick.round}.{pick.draft_pick.pick_number}
                                                        </span>
                                                        <span className="results_player_name">
                                                            {pick.player.name}
                                                        </span>
                                                        <span className="results_player_background">
                                                            {pick.player.college}
                                                        </span>
                                                    </div>

                                                    <div className="results_player_labels">
                                                        <div className="results_player_position">
                                                            {pick.player.position}
                                                        </div>

                                                        <div className="results_pick_rank">
                                                            <small>{pick.player.rank}</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        );
                                    });
                                })()
                            ) : activeTab === "full" && fullDraftView === "grid" ? (
                                picksByRound[currentRoundIndex].map(pick => (
                                    <div key={pick.id} className="results_pick grid">
                                        <div className="results_pick_logo_wrapper grid">
                                            <img
                                                src={`/logos/nfl/${pick.team.name.toLowerCase()}.png`}
                                                alt={pick.team.name}
                                                className="results_pick_logo grid"
                                            />
                                        </div>

                                        <div className="results_pick_details grid">
                                            <span className="results_player_name grid">
                                                {pick.player.name}
                                            </span>
                                            <span className="results_player_background grid">
                                                {pick.player.college}
                                            </span>
                                        </div>

                                        <div className="results_player_labels grid">
                                            <div className="results_player_position grid">
                                                {pick.player.position}
                                            </div>
                                            
                                            <div className="results_pick_number grid">
                                                <small>{pick.draft_pick.pick_number}</small>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                (() => {
                                    const team = teams.find(team => team.team.id === activeTab);
                                    if (!team) return null;

                                    return team.picks.map(pick => (
                                        <div key={pick.id} className="results_pick">
                                            <div className="results_pick_logo_wrapper">
                                                <img
                                                    src={`/logos/college/${pick.player.college.replaceAll(" ", "_")}.png`}
                                                    alt={pick.player.college}
                                                    className="results_pick_logo"
                                                />
                                            </div>

                                            <div className="results_pick_details">
                                                <span className="results_pick_number">
                                                    {pick.draft_pick.round}.{pick.draft_pick.pick_number}
                                                </span>
                                                <span className="results_player_name">
                                                    {pick.player.name}
                                                </span>
                                                <span className="results_player_background">
                                                    {pick.player.college}
                                                </span>
                                            </div>

                                            <div className="results_player_labels">
                                                <div className="results_player_position">
                                                    {pick.player.position}
                                                </div>

                                                <div className="results_pick_rank">
                                                    <small>{pick.player.rank}</small>
                                                </div>
                                            </div>
                                        </div>
                                    ));
                                })()
                            )}
                        </div>

                        <div className="view_controls_wrapper">
                            {activeTab === "full" && fullDraftView === "grid" && (
                                <div className="round_nav">
                                    <button
                                        className="round_arrow"
                                        onClick={() => setCurrentRoundIndex((prev) => Math.max(prev - 1, 0))}
                                        disabled={currentRoundIndex === 0}
                                    >
                                        ◀
                                    </button>

                                    <span className="round_label">
                                        Round {rounds[currentRoundIndex]}
                                    </span>

                                    <button
                                        className="round_arrow"
                                        onClick={() => setCurrentRoundIndex((prev) => Math.min(prev + 1, rounds.length - 1))}
                                        disabled={currentRoundIndex === rounds.length - 1}
                                    >
                                        ▶
                                    </button>
                                </div>
                            )}

                            {activeTab === "full" && (
                                <div className="view_toggle">
                                    <button className={`switch_option list ${fullDraftView === "list" ? "active" : ""}`} onClick={() => setFullDraftView("list")}>
                                        List
                                    </button>
                                    <button className={`switch_option grid ${fullDraftView === "grid" ? "active" : ""}`} onClick ={() => setFullDraftView("grid")}>
                                        Grid
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default Results;