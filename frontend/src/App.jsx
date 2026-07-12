/*
  * Main App component. Sets up main application routes using React Router.
*/


// Import necessary libraries and components
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import axios from "axios";
import Home from "./pages/Home";
import Draft from "./pages/Draft";
import Results from "./pages/Results";
import "./App.css";

// Function to set up the main application routes
function App() {
  const apiURL = "https://nfl-mock-draft-simulator.onrender.com";

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
      </Routes>
    </Router>
  );
}

export default App;

