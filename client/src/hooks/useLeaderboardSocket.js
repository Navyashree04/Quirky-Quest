import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

/**
 * Subscribes to live updates for a single leaderboard ('overall' or a game slug).
 * Returns the latest pushed entries, or null until the first update/fetch arrives.
 */
export function useLeaderboardSocket(game) {
  const [liveEntries, setLiveEntries] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!game) return undefined;

    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('leaderboard:subscribe', game);
    });

    socket.on('leaderboard:update', (payload) => {
      if (payload.game === game) {
        setLiveEntries(payload.leaderboard);
      }
    });

    return () => {
      socket.emit('leaderboard:unsubscribe', game);
      socket.disconnect();
    };
  }, [game]);

  return liveEntries;
}
