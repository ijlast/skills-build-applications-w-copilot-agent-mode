import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = {
  title: string;
  reason: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const userEmail = encodeURIComponent('mona@example.com');
    getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${userEmail}`)
      .then(({ suggestions: results }) => setSuggestions(results))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {loading && <p role="status">Loading workout suggestions...</p>}
        {!loading && error && <p role="alert">Unable to load workout suggestions.</p>}
        {!loading && !error && suggestions.length === 0 && <p>No workout suggestions yet.</p>}
        {!loading && !error && suggestions.length > 0 && (
          <ul>
            {suggestions.map((suggestion, index) => (
              <li key={`${suggestion.title}-${index}`}>
                <strong>{suggestion.title}</strong>: {suggestion.reason}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
