import React, { useEffect, useState } from "react";
import { FIREBASE_STORE } from "../firebase"; // Firestore configuration import
import { doc, collection, getDoc, onSnapshot } from "@firebase/firestore"; // Firestore imports
import "./LiveSessions.css"; // CSS file
import OrlandoPB from "../assets/orlandopb.png";

export default function LiveSessions() {
  const [activeUsers, setActiveUsers] = useState(0);
  const [hitOutdoor, setHitOutdoor] = useState(0);
  const [hitIndoor, setHitIndoor] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [activeGames, setActiveGames] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    // Firestore references for documents
    const activeUsersRef = doc(FIREBASE_STORE, "stats/activeUsers");
    const hitOutdoorRef = doc(FIREBASE_STORE, "stats/hitOutdoor");
    const hitIndoorRef = doc(FIREBASE_STORE, "stats/hitIndoor");

    // Use Firestore's onSnapshot to listen for live updates
    const unsubscribeActive = onSnapshot(activeUsersRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setActiveUsers(docSnapshot.data().count || 0);
      }
    });

    const unsubscribeOutdoorHits = onSnapshot(hitOutdoorRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setHitOutdoor(docSnapshot.data().count || 0);
      }
    });

    const unsubscribeIndoorHits = onSnapshot(hitIndoorRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setHitIndoor(docSnapshot.data().count || 0);
      }
    });

    return () => {
      unsubscribeActive();
      unsubscribeOutdoorHits();
      unsubscribeIndoorHits();
    };
  }, []);

  // Fetch active games for the selected location
  const fetchActiveGames = (location) => {
    const activeGamesRef = collection(
      FIREBASE_STORE,
      `locations/${location}/activeGames`,
    );
    onSnapshot(activeGamesRef, (snapshot) => {
      const games = snapshot.docs.map((doc) => doc.data());
      setActiveGames(games);
    });
  };

  // Fetch leaderboard for the selected location
  const fetchLeaderboard = (location) => {
    const leaderboardRef = collection(
      FIREBASE_STORE,
      `locations/${location}/leaderboard`,
    );
    onSnapshot(leaderboardRef, (snapshot) => {
      const leaderboardData = snapshot.docs.map((doc) => doc.data());
      setLeaderboard(leaderboardData);
    });
  };

  // Handle when a location box is clicked
  const handleLocationClick = (location) => {
    setSelectedLocation(location); // Set the selected location
    fetchActiveGames(location); // Fetch active games for that location
    fetchLeaderboard(location); // Fetch leaderboard for that location
  };

  // Reset the view to show locations instead of games/leaderboard
  const handleBackToLocations = () => {
    setSelectedLocation(null);
    setActiveGames([]);
    setLeaderboard([]);
  };

  return (
    <div className="live-sessions">
      <h1>Live Sessions</h1>

      {selectedLocation ? (
        <div className="location-details">
          <button onClick={handleBackToLocations}>Back to Locations</button>

          <h2>Active Games at {selectedLocation}</h2>
          {activeGames.length > 0 ? (
            <ul>
              {activeGames.map((game, index) => (
                <li key={index}>{game.name}</li> // Assuming each game has a "name" property
              ))}
            </ul>
          ) : (
            <p>No active games.</p>
          )}

          <h2>Leaderboard at {selectedLocation}</h2>
          {leaderboard.length > 0 ? (
            <ul>
              {leaderboard.map((player, index) => (
                <li key={index}>
                  {player.name}: {player.score} points
                </li>
              ))}
            </ul>
          ) : (
            <p>No leaderboard data available.</p>
          )}
        </div>
      ) : (
        <div className="live-sessions-container">
          {/* Unverified Orlando Paintball */}
          <div
            className="location-box"
            onClick={() => handleLocationClick("Orlando Paintball")}
          >
            <div className="logo-container">
              <img
                src={OrlandoPB}
                alt="Orlando Paintball Logo"
                className="logopb"
              />
            </div>
            <div className="location-info">
              <h2>Orlando Paintball</h2>
              <div className="verification-box unverified">
                <span className="checkmark">✔</span> Unverified
              </div>
            </div>
          </div>

          {/* Verified Example (commented out) */}
          {/* <div className="location-box" onClick={() => handleLocationClick('Another Arena')}>
            <div className="logo-container">
              <img src={OrlandoPB} alt="Another Paintball Logo" className="logopb" />
            </div>
            <div className="location-info">
              <h2>Another Paintball Arena</h2>
              <div className="verification-box verified">
                <span className="checkmark">✔</span> Verified
              </div>
            </div>
          </div> */}
        </div>
      )}
    </div>
  );
}
