import React, { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, setDoc, getDocs, getDoc, query, collection, where } from "@firebase/firestore";
import { FIREBASE_STORE, FIREBASE_AUTH } from "../firebase";
import { Scanner } from "@yudiel/react-qr-scanner"; // Import a QR code scanner library
import "./QRCodeScanner.css"; 

const QRCodeScannerComponent = ({ locationId }) => {
  const [user] = useAuthState(FIREBASE_AUTH);
  const [scannedPlayer, setScannedPlayer] = useState(null);
  const [error, setError] = useState(null);
  const [team, setTeam] = useState(null);
  const [playerList, setPlayerList] = useState([]);

  const handleScan = async (qrValue) => {
    if (!qrValue) return;
  
    const match = qrValue.match(/^\w+$/); // Ensure it's a valid alphanumeric ID
    if (!match) {
      setError("Invalid QR code format");
      return;
    }
  
    const playerID = match[0]; // Extract the scanned Player ID
    console.log("Scanned Player ID:", playerID);
  
    try {
      // Query Firestore to find a document where playerID matches
      const usersQuery = query(
        collection(FIREBASE_STORE, "users"),
        where("playerID", "==", playerID)
      );
      const querySnapshot = await getDocs(usersQuery);
  
      if (!querySnapshot.empty) {
        // Get the first matching document (assuming playerID is unique)
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
  
        console.log("Fetched User Data:", userData);
  
        // Check if the authenticated user's userId matches the document's ID
        if (user?.uid === userDoc.id) {
          // Add the scanned player to the state
          setScannedPlayer({ userId: userDoc.id, ...userData });
          setPlayerList((prevList) => [
            ...prevList,
            { userId: userDoc.id, ...userData, team },
          ]);
  
          // Add the player to the activePlayers subcollection
          const playerDocRef = doc(
            FIREBASE_STORE,
            `locations/${locationId}/activePlayers`,
            playerID,
          );
          await setDoc(
            playerDocRef,
            {
              name: userData.name || userData.email,
              team: team,
              isReferee: false,
            },
            { merge: true }
          );
        } else {
          setError("Player ID does not belong to the current user.");
        }
      } else {
        setError("User not found");
      }
    } catch (err) {
      console.error("Error fetching user document:", err);
      setError("Failed to fetch user data. Please try again.");
    }
  };

  const handleError = (err) => {
    console.error("QR Code scan error:", err);
    setError("QR scan failed. Please try again.");
  };

  return (
    <div className="qr-scanner-container">
      <h2>Scan a Player's QR Code</h2>
      <Scanner
        // FIXME: Can scan multiple QR Codes at once if they are all in the camera at once which would end up breaking
        //        this. Should iterate over every object in the arrea and handle the scan on each.
        onScan={(result) =>
          result[0]?.rawValue && handleScan(result[0].rawValue)
        }
        onError={handleError}
        style={{
          width: "100%",
          border: `5px solid ${team === "A" ? "red" : team === "B" ? "blue" : "gray"}`,
        }}
      />

      <div className="team-buttons">
        <button
          style={{ backgroundColor: "red", color: "white" }}
          onClick={() => setTeam("A")}
        >
          TEAM A
        </button>
        <button
          style={{ backgroundColor: "blue", color: "white" }}
          onClick={() => setTeam("B")}
        >
          TEAM B
        </button>
      </div>

      <div className="status-container">
        <div className="status">
          <p>{scannedPlayer ? "Verified" : "Unknown*"}</p>
        </div>
        <div className="game-id">
          <p>Game ID</p>
        </div>
      </div>

      <div className="player-list">
        <h3>Scanned Players</h3>
        {playerList.map((player, index) => (
          <div key={index} className="player">
            <p>
              {player.name} - Team {player.team}
            </p>
          </div>
        ))}
      </div>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default QRCodeScannerComponent;
