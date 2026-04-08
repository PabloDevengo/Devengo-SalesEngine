import { useState, useEffect } from "react";

/**
 * Fetches a JSON file from /public/data/ at runtime.
 * This means you can edit the JSON files directly on GitHub
 * and all users will get the updated data after the next deploy.
 *
 * Usage:
 *   const { data, loading, error } = useData("geografias");
 *   // → fetches /data/geografias.json
 */
export function useData(filename) {
  const [data,    setData]    = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/data/${filename}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Could not load /data/${filename}.json (HTTP ${res.status})`);
        return res.json();
      })
      .then((json) => { if (!cancelled) { setData(json); setLoading(false); } })
      .catch((err) => { if (!cancelled) { setError(err.message); setLoading(false); } });

    return () => { cancelled = true; };
  }, [filename]);

  return { data, loading, error };
}
