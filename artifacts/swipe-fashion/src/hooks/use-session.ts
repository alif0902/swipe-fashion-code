import { useState, useEffect } from 'react';

export function useSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem('swipefash_session');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('swipefash_session', id);
    }
    setSessionId(id);
  }, []);

  return sessionId;
}
