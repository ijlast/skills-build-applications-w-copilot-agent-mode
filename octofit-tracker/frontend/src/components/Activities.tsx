import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = {
  type: string;
  minutes: number;
  points: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then(({ activities: results }) => setActivities(results))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        <p>Track student activity minutes and points.</p>
        {loading && <p role="status">Loading activities...</p>}
        {!loading && error && <p role="alert">Unable to load activities.</p>}
        {!loading && !error && activities.length === 0 && <p>No activities yet.</p>}
        {!loading && !error && activities.length > 0 && (
          <ul>
            {activities.map((activity, index) => (
              <li key={`${activity.type}-${index}`}>
                {activity.type}: {activity.minutes} minutes, {activity.points} points
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
