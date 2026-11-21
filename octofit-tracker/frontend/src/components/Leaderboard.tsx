import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then(({ leaderboard: results }) => setLeaderboard(results))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {loading && <p role="status">Loading leaderboard...</p>}
        {!loading && error && <p role="alert">Unable to load leaderboard.</p>}
        {!loading && !error && leaderboard.length === 0 && <p>No leaderboard scores yet.</p>}
        {!loading && !error && leaderboard.length > 0 && (
          <ol>
            {leaderboard.map((entry) => (
              <li key={entry.rank}>
                {entry.teamName}: {entry.totalPoints} points
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
