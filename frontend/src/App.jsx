/*
  * Main App component. Sets up main application routes using React Router.
*/


// Import necessary libraries and components
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import axios from "axios";
import Home from "./pages/Home";
import Draft from "./pages/Draft";
import Results from "./pages/Results";
import "./App.css";

const FootballIntelligenceOperationsCenter = lazy(() =>
  import("./pages/FootballIntelligenceOperationsCenter.jsx")
);

const DraftRoomPreview = lazy(() => import("./pages/DraftRoomPreview.jsx"));
const DraftResultsPreview = lazy(() => import("./pages/DraftResultsPreview.jsx"));
const ProspectVerificationCenter = lazy(() => import("./pages/ProspectVerificationCenter.jsx"));

const footballIntelligenceOperationsEnabled =
  import.meta.env.DEV ||
  import.meta.env.VITE_ENABLE_FOOTBALL_INTELLIGENCE_OPS === "true";

const draftRoomPreviewEnabled =
  import.meta.env.DEV ||
  import.meta.env.VITE_ENABLE_FID_DRAFT_ROOM_PREVIEW === "true";

// Function to set up the main application routes
function App() {
  const productionApiURL =
    import.meta.env.VITE_API_URL ||
    "https://nfl-mock-draft-simulator-5q81.onrender.com";

  // During local Vite development, use the same-origin /api proxy. This avoids
  // browser CORS enforcement while preserving the production API URL in builds.
  const apiURL = import.meta.env.DEV ? "/api" : productionApiURL;

  useEffect(() => {

    // Preload critical data to wake up backend server
    const preloadData = async () => {
      try {
        
        // Ping health endpoint to wake up server
        await axios.get(`${apiURL}/health`, { timeout: 30000 });

        // Preload teams data
        await axios.get(`${apiURL}/teams/`, { timeout: 30000 });

        console.log("Backend preloaded successfully");
      } catch (error) {
        console.log("Preload failed (this is normal on first visit):", error.message);
      }
    }

    preloadData();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home apiURL={apiURL} />} />
        <Route path="/draft/:draftId" element={<Draft apiURL={apiURL} />} />
        <Route path="/results/:draftId" element={<Results apiURL={apiURL} />} />
        {footballIntelligenceOperationsEnabled && (
          <Route
            path="/__dev/prospect-verification"
            element={
              <Suspense fallback={<div role="status">Loading Prospect Verification Center…</div>}>
                <ProspectVerificationCenter />
              </Suspense>
            }
          />
        )}
        {footballIntelligenceOperationsEnabled && (
          <Route
            path="/__dev/football-intelligence"
            element={
              <Suspense
                fallback={
                  <div role="status">
                    Loading Football Intelligence Operations Center…
                  </div>
                }
              >
                <FootballIntelligenceOperationsCenter />
              </Suspense>
            }
          />
        )}
        {draftRoomPreviewEnabled && (
          <Route
            path="/__dev/draft-room-preview"
            element={
              <Suspense fallback={<div role="status">Loading fixture Draft Room preview…</div>}>
                <DraftRoomPreview />
              </Suspense>
            }
          />
        )}
        {draftRoomPreviewEnabled && (
          <Route
            path="/__dev/draft-results-preview"
            element={
              <Suspense fallback={<div role="status">Loading fixture Draft Results preview…</div>}>
                <DraftResultsPreview />
              </Suspense>
            }
          />
        )}
      </Routes>
    </Router>
  );
}

export default App;
