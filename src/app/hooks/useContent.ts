import { useState, useEffect } from "react";

export function useContent(namespace: string): {
  get: (key: string, fallback?: string) => string;
  loading: boolean;
} {
  const [data, setData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/content?ns=${encodeURIComponent(namespace)}`)
      .then((r) => r.json())
      .then((d: Record<string, string>) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [namespace]);

  function get(key: string, fallback = "") {
    return data[key] ?? fallback;
  }

  return { get, loading };
}
