// src/pages/MyMatches.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import "./MyMatches.css";
import BackButton from "../components/BackButton";

const MyMatches = () => {
  const [allMatches, setAllMatches] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  const API_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:5002"
      : "https://freefire-server-t.onrender.com";

  const getAllBgmiIds = () => {
    try {
      const tournamentJoins = JSON.parse(
        localStorage.getItem("tournamentJoins") || "[]"
      );

      const uniqueIds = [...new Set(tournamentJoins.map((join) => join.bgmiId))];

      const fallback =
        localStorage.getItem("tempBgmiId") ||
        localStorage.getItem("lastBgmiId");

      if (fallback && !uniqueIds.includes(fallback)) {
        uniqueIds.push(fallback);
      }

      return uniqueIds.filter(Boolean);
    } catch {
      return [
        localStorage.getItem("tempBgmiId") ||
          localStorage.getItem("lastBgmiId"),
      ].filter(Boolean);
    }
  };

  const normalizeMatches = (matches) => {
    const uniqueMap = new Map();

    matches.forEach((match) => {
      if (!match?.id) return;
      uniqueMap.set(match.id, match);
    });

    return Array.from(uniqueMap.values()).sort(
      (a, b) => new Date(b.joined_at) - new Date(a.joined_at)
    );
  };

  const fetchMatchesInitial = useCallback(async () => {
    setIsInitialLoading(true);

    const bgmiIds = getAllBgmiIds();
    if (bgmiIds.length === 0) {
      setAllMatches([]);
      setIsInitialLoading(false);
      return;
    }

    try {
      const allMatchesPromises = bgmiIds.map(async (id) => {
        const res = await fetch(`${API_URL}/api/my-matches?bgmiId=${id}`);
        const data = await res.json();
        return data.matches || [];
      });

      const allMatchesArrays = await Promise.all(allMatchesPromises);
      const allMatchesFlat = allMatchesArrays.flat();
      const sortedMatches = normalizeMatches(allMatchesFlat);

      setAllMatches(sortedMatches);
    } catch (err) {
      console.error("Initial fetch error:", err);
      setAllMatches([]);
    } finally {
      setIsInitialLoading(false);
      hasLoadedRef.current = true;
    }
  }, [API_URL]);

  const fetchMatchesSilently = useCallback(async () => {
    const bgmiIds = getAllBgmiIds();
    if (bgmiIds.length === 0) return;

    try {
      const allMatchesPromises = bgmiIds.map(async (id) => {
        const res = await fetch(`${API_URL}/api/my-matches?bgmiId=${id}`);
        const data = await res.json();
        return data.matches || [];
      });

      const allMatchesArrays = await Promise.all(allMatchesPromises);
      const allMatchesFlat = allMatchesArrays.flat();
      const sortedMatches = normalizeMatches(allMatchesFlat);

      setAllMatches((prevMatches) => {
        if (JSON.stringify(prevMatches) === JSON.stringify(sortedMatches)) {
          return prevMatches;
        }
        return sortedMatches;
      });
    } catch (err) {
      console.error("Silent fetch error:", err);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchMatchesInitial();
  }, [fetchMatchesInitial]);

  useEffect(() => {
    const interval = setInterval(fetchMatchesSilently, 12000);
    return () => clearInterval(interval);
  }, [fetchMatchesSilently]);

  if (isInitialLoading) {
    return (
      <div className="mymatches-page">
        <BackButton fallbackPath="/" />
        <div className="simple-loading">
          <div>⏳ Loading matches...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mymatches-page">
      <BackButton fallbackPath="/" />

      <div className="mymatches-container">
        <div className="page-header">
          <h1>मेरे मैच</h1>
          <p>
            Total: <strong>{allMatches.length}</strong> matches found
          </p>
        </div>

        {allMatches.length > 0 ? (
          <div className="matches-grid">
            {allMatches.map((match) => {
              const winnerPrize =
                match.winner_prize ??
                match.winnerPrize ??
                match.prize_pool ??
                match.prizePool;

              const roomId = match.room_id ?? match.roomId ?? "";
              const roomPassword =
                match.room_password ?? match.roomPassword ?? "";

              return (
                <div key={match.id} className="match-card">
                  <div className="match-header">
                    <h3>{match.tournament_name || "Tournament"}</h3>
                    <span className="status registered">Registered</span>
                  </div>

                  <div className="match-details">
                    <div className="detail-row">
                      <span>Player:</span>
                      <span className="highlight">
                        {match.player_name || "-"}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span>BGMI ID:</span>
                      <span className="highlight">{match.bgmi_id || "-"}</span>
                    </div>

                    <div className="detail-row">
                      <span>Entry:</span>
                      <span>
                        {match.entry_fee != null && match.entry_fee !== ""
                          ? `₹${match.entry_fee}`
                          : "-"}
                      </span>
                    </div>

                    {winnerPrize != null && winnerPrize !== "" && (
                      <div className="detail-row">
                        <span>Winner Prize:</span>
                        <span className="highlight">₹{winnerPrize}</span>
                      </div>
                    )}

                    {match.map && (
                      <div className="detail-row">
                        <span>Map:</span>
                        <span>{match.map}</span>
                      </div>
                    )}

                    {match.mode && (
                      <div className="detail-row">
                        <span>Mode:</span>
                        <span>{match.mode}</span>
                      </div>
                    )}

                    <div className="detail-row">
                      <span>Date:</span>
                      <span>{match.date || "-"}</span>
                    </div>

                    <div className="detail-row">
                      <span>Time:</span>
                      <span>{match.time || "-"}</span>
                    </div>

                    {roomId ? (
                      <div className="room-box">
                        <div className="detail-row">
                          <span>Room ID:</span>
                          <strong>{roomId}</strong>
                        </div>
                        <div className="detail-row">
                          <span>Password:</span>
                          <strong>{roomPassword || "-"}</strong>
                        </div>
                      </div>
                    ) : (
                      <div className="room-pending">
                        ⏳ Room details coming soon
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-matches">
            <h2>कोई मैच नहीं मिला</h2>
            <p>No matches found for your BGMI IDs</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyMatches;