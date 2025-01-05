import React, { useEffect, useState } from "react";
import {
  doc,
  updateDoc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
} from "@firebase/firestore";
import { FIREBASE_STORE } from "../firebase";
import "./Leaderboard.css";

const calculateElo = (winnerElo, loserElo) => {
  const kFactor = 32; // A standard K-factor for Elo systems
  const expectedScoreWinner =
    1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedScoreLoser =
    1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));

  // Elo formula: newRating = oldRating + kFactor * (actualScore - expectedScore)
  const newWinnerElo = Math.round(
    winnerElo + kFactor * (1 - expectedScoreWinner),
  );
  const newLoserElo = Math.round(loserElo + kFactor * (0 - expectedScoreLoser));

  return { newWinnerElo, newLoserElo };
};

// Function to update Firestore with match result and Elo calculations
export const updateLeaderboardWithMatchResult = async (
  playerID,
  opponentId,
  isWinner
) => {
  try {
    const playerRef = doc(FIREBASE_STORE, "leaderboard", playerID);
    const opponentRef = doc(FIREBASE_STORE, "leaderboard", opponentId);
    const playerUserRef = doc(FIREBASE_STORE, "users", playerID); // User doc for player
    const opponentUserRef = doc(FIREBASE_STORE, "users", opponentId); // User doc for opponent

    // Fetch current Elo ratings for both players
    const playerSnap = await getDoc(playerRef);
    const opponentSnap = await getDoc(opponentRef);

    // If the player or opponent doesn't exist in leaderboard, add them with default values
    if (!playerSnap.exists()) {
      console.log(
        `Player ${playerID} not found in leaderboard, adding with default values.`
      );
      await setDoc(playerRef, { wins: 0, losses: 0, elo: 1000 });
      await setDoc(playerUserRef, { wins: 0, losses: 0, elo: 1000 }); // Sync to users collection
    }

    if (!opponentSnap.exists()) {
      console.log(
        `Opponent ${opponentId} not found in leaderboard, adding with default values.`
      );
      await setDoc(opponentRef, { wins: 0, losses: 0, elo: 1000 });
      await setDoc(opponentUserRef, { wins: 0, losses: 0, elo: 1000 }); // Sync to users collection
    }

    // Fetch the updated player and opponent data
    const updatedPlayerSnap = await getDoc(playerRef);
    const updatedOpponentSnap = await getDoc(opponentRef);

    const playerData = updatedPlayerSnap.data();
    const opponentData = updatedOpponentSnap.data();

    const playerElo = playerData.elo || 1000;
    const opponentElo = opponentData.elo || 1000;

    // Calculate new Elo ratings
    const { newWinnerElo, newLoserElo } = calculateElo(playerElo, opponentElo);

    // Update leaderboard and users collection
    if (isWinner) {
      // Update player (winner)
      await updateDoc(playerRef, {
        wins: (playerData.wins || 0) + 1,
        elo: newWinnerElo,
      });
      await updateDoc(playerUserRef, {
        wins: (playerData.wins || 0) + 1,
        elo: newWinnerElo,
      });

      // Update opponent (loser)
      await updateDoc(opponentRef, {
        losses: (opponentData.losses || 0) + 1,
        elo: newLoserElo,
      });
      await updateDoc(opponentUserRef, {
        losses: (opponentData.losses || 0) + 1,
        elo: newLoserElo,
      });
    } else {
      // Update player (loser)
      await updateDoc(playerRef, {
        losses: (playerData.losses || 0) + 1,
        elo: newLoserElo,
      });
      await updateDoc(playerUserRef, {
        losses: (playerData.losses || 0) + 1,
        elo: newLoserElo,
      });

      // Update opponent (winner)
      await updateDoc(opponentRef, {
        wins: (opponentData.wins || 0) + 1,
        elo: newWinnerElo,
      });
      await updateDoc(opponentUserRef, {
        wins: (opponentData.wins || 0) + 1,
        elo: newWinnerElo,
      });
    }

    console.log(
      `Elo ratings updated! Player: ${newWinnerElo}, Opponent: ${newLoserElo}`
    );
  } catch (error) {
    console.error("Error updating leaderboard:", error);
  }
};

const Leaderboard = () => {
  const [scores, setScores] = useState([]);
  const [activeScores, setActiveScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const leaderboardUnsub = onSnapshot(
      collection(FIREBASE_STORE, "leaderboard"),
      (snapshot) => {
        const scoreList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        scoreList.sort((a, b) => b.wins - a.wins || b.elo - a.elo); // Sort by wins, then Elo
        setScores(scoreList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching leaderboard:", error);
      },
    );

    const activePlayersUnsub = onSnapshot(
      collection(FIREBASE_STORE, "locations/OrlandoPaintball/activePlayers"),
      (snapshot) => {
        const activePlayerIDS = snapshot.docs.map((doc) => doc.id);
        setActiveScores(
          scores.filter((score) => activePlayerIDS.includes(score.id)),
        );
      },
    );

    return () => {
      leaderboardUnsub();
      activePlayersUnsub();
    };
  }, [scores]);

  if (loading) {
    return <div>Loading...</div>;
  }

  const renderTable = (data, title) => (
    <>
      <h2>{title}</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Wins</th>
            <th>Losses</th>
            <th>W/L Ratio</th>
            <th>Elo Rating</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((score) => {
              const wins = score.wins || 0;
              const losses = score.losses || 0;
              const ratio =
                losses === 0
                  ? wins > 0
                    ? "Infinity"
                    : "N/A"
                  : (wins / losses).toFixed(2);

              return (
                <tr key={score.id}>
                  <td>{score.id}</td>
                  <td>{wins}</td>
                  <td>{losses}</td>
                  <td>{ratio}</td>
                  <td>{score.elo || "N/A"}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="5">No data available</td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );

  return (
    <div className="container">
      <h1>Leaderboard</h1>
      {renderTable(scores, "Overall Leaderboard")}
      {renderTable(activeScores, "Active Users Leaderboard")}
    </div>
  );
};

export default Leaderboard;
