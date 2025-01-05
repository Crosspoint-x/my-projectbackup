import React, { useEffect, useState } from "react";
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  collection,
  deleteDoc,
} from "@firebase/firestore";
import { FIREBASE_STORE } from "../firebase";
import { updateLeaderboardWithMatchResult } from "../leaderboard/Leaderboard";
import "./MatchEntry.css";

const MatchEntry = ({ locationId = "OrlandoPaintball" }) => {
  const [activePlayers, setActivePlayers] = useState([]);
  const [teamA, setTeamA] = useState([]);
  const [teamB, setTeamB] = useState([]);
  const [gameResult, setGameResult] = useState("");
  const [inputPlayer, setInputPlayer] = useState(""); // Text input for adding player

  useEffect(() => {
    if (!locationId) {
      console.error("Invalid locationId: ", locationId);
      return; // If locationId is undefined, exit early
    }

    const activePlayersCollectionRef = collection(
      FIREBASE_STORE,
      `locations/${locationId}/activePlayers`,
    );
    const teamsRef = doc(
      FIREBASE_STORE,
      `locations/${locationId}/teams/teamData`,
    ); // Corrected document reference

    const unsubscribePlayers = onSnapshot(
      activePlayersCollectionRef,
      (snapshot) => {
        const playersData = snapshot.docs.map((doc) => doc.data());
        setActivePlayers(playersData);
      },
    );

    const unsubscribeTeams = onSnapshot(teamsRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const { teamA: savedTeamA = [], teamB: savedTeamB = [] } =
          docSnapshot.data();
        setTeamA(savedTeamA);
        setTeamB(savedTeamB);
      }
    });

    return () => {
      unsubscribePlayers();
      unsubscribeTeams();
    };
  }, [locationId]);

  // Add a player to a team
  const handleTeamAssignment = async (playerId, team) => {
    let newTeamA = [...teamA];
    let newTeamB = [...teamB];

    if (team === "A" && teamA.length < 5) {
      newTeamA = [...teamA, playerId];
      newTeamB = teamB.filter((id) => id !== playerId);
    } else if (team === "B" && teamB.length < 5) {
      newTeamB = [...teamB, playerId];
      newTeamA = teamA.filter((id) => id !== playerId);
    }

    setTeamA(newTeamA);
    setTeamB(newTeamB);

    const teamsRef = doc(
      FIREBASE_STORE,
      `locations/${locationId}/teams/teamData`,
    );
    await setDoc(
      teamsRef,
      { teamA: newTeamA, teamB: newTeamB },
      { merge: true },
    );
  };

  // Handle game result (team A wins or team B wins)
  const handleGameResult = async (winningTeam) => {
    if (!locationId) {
      console.error("Invalid locationId for game result: ", locationId);
      return;
    }

    const currentGameRef = doc(
      FIREBASE_STORE,
      `locations/${locationId}/currentGame/gameData`,
    );
    const losingTeam = winningTeam === "teamA" ? "teamB" : "teamA";

    const gameData = {
      teamA: teamA.map((playerId) => ({
        playerId,
        wins: winningTeam === "teamA" ? 1 : 0,
      })),
      teamB: teamB.map((playerId) => ({
        playerId,
        wins: winningTeam === "teamB" ? 1 : 0,
      })),
    };

    try {
      await setDoc(currentGameRef, gameData, { merge: true });
      setGameResult(`Team ${winningTeam === "teamA" ? "A" : "B"} wins!`);

      for (const playerId of teamA) {
        const isWinner = winningTeam === "teamA";
        await updateLeaderboardWithMatchResult(playerId, teamB[0], isWinner);
      }

      for (const playerId of teamB) {
        const isWinner = winningTeam === "teamB";
        await updateLeaderboardWithMatchResult(playerId, teamA[0], isWinner);
      }
    } catch (error) {
      console.error("Error updating game result:", error);
    }
  };

  // Add a new player to the unassigned players list
  const handleAddPlayer = async () => {
    if (!inputPlayer) return;
    if (!locationId) {
      console.error("Invalid locationId for adding player: ", locationId);
      return;
    }

    const activePlayersCollectionRef = collection(
      FIREBASE_STORE,
      `locations/${locationId}/activePlayers`,
    );
    const playerDocRef = doc(activePlayersCollectionRef, inputPlayer);
    const player = { userId: inputPlayer, name: inputPlayer };

    try {
      const playerDoc = await getDoc(playerDocRef);
      if (playerDoc.exists()) {
        await updateDoc(playerDocRef, player);
      } else {
        await setDoc(playerDocRef, player);
      }

      setActivePlayers((prevPlayers) => [...prevPlayers, player]);
      setInputPlayer("");
    } catch (error) {
      console.error("Error adding player:", error);
    }
  };

  // Remove a player from a team
  const handleRemovePlayerFromTeam = async (playerId, team) => {
    let newTeamA = [...teamA];
    let newTeamB = [...teamB];

    if (team === "A") {
      newTeamA = teamA.filter((id) => id !== playerId);
    } else if (team === "B") {
      newTeamB = teamB.filter((id) => id !== playerId);
    }

    setTeamA(newTeamA);
    setTeamB(newTeamB);

    const teamsRef = doc(
      FIREBASE_STORE,
      `locations/${locationId}/teams/teamData`,
    );
    await setDoc(
      teamsRef,
      { teamA: newTeamA, teamB: newTeamB },
      { merge: true },
    );
  };

  // Remove a player from the unassigned players list
  const handleRemoveUnassignedPlayer = async (playerId) => {
    try {
      const playerDocRef = doc(
        FIREBASE_STORE,
        `locations/${locationId}/activePlayers`,
        playerId,
      );
      await deleteDoc(playerDocRef);
      setActivePlayers((prevPlayers) =>
        prevPlayers.filter((player) => player.userId !== playerId),
      );
    } catch (error) {
      console.error("Error removing player:", error);
    }
  };

  return (
    <div className="add-score-container">
      <h2>Assign Players to Teams</h2>

      <div className="unassigned-players">
        <h3>Unassigned Players</h3>

        <input
          type="text"
          value={inputPlayer}
          onChange={(e) => setInputPlayer(e.target.value)}
          placeholder="Enter player name"
        />
        <button onClick={handleAddPlayer}>Add Player</button>

        {activePlayers
          .filter(
            (player) =>
              !teamA.includes(player.userId) && !teamB.includes(player.userId),
          )
          .map((player) => (
            <div key={player.userId}>
              <p>{player.name}</p>
              <button onClick={() => handleTeamAssignment(player.userId, "A")}>
                Add to Team A
              </button>
              <button onClick={() => handleTeamAssignment(player.userId, "B")}>
                Add to Team B
              </button>
              <button
                onClick={() => handleRemoveUnassignedPlayer(player.userId)}
              >
                Remove
              </button>
            </div>
          ))}
      </div>

      <table>
        <thead>
          <tr>
            <th>
              <h3>Team A (Max 5 players)</h3>
            </th>
            <th>
              <h3>Team B (Max 5 players)</h3>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              {teamA.map((playerId) => (
                <div key={playerId}>
                  <p>{playerId}</p>
                  <button
                    onClick={() => handleRemovePlayerFromTeam(playerId, "A")}
                  >
                    Remove from Team A
                  </button>
                </div>
              ))}
            </td>
            <td>
              {teamB.map((playerId) => (
                <div key={playerId}>
                  <p>{playerId}</p>
                  <button
                    onClick={() => handleRemovePlayerFromTeam(playerId, "B")}
                  >
                    Remove from Team B
                  </button>
                </div>
              ))}
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Game Result</h2>
      <button onClick={() => handleGameResult("teamA")}>Team A Wins</button>
      <button onClick={() => handleGameResult("teamB")}>Team B Wins</button>
      {gameResult && <p>{gameResult}</p>}
    </div>
  );
};

export default MatchEntry;
