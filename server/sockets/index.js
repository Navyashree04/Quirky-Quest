const { Server } = require('socket.io');
const env = require('../config/env');
const logger = require('../utils/logger');

let io;

function gameRoom(game) {
  return `leaderboard:${game}`;
}

const OVERALL_ROOM = 'leaderboard:overall';

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.clientOrigin,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id}`);

    // Clients subscribe to the leaderboard(s) they're currently viewing so we
    // only broadcast to interested sockets rather than every connected client.
    socket.on('leaderboard:subscribe', (game) => {
      if (game === 'overall') {
        socket.join(OVERALL_ROOM);
      } else {
        socket.join(gameRoom(game));
      }
    });

    socket.on('leaderboard:unsubscribe', (game) => {
      if (game === 'overall') {
        socket.leave(OVERALL_ROOM);
      } else {
        socket.leave(gameRoom(game));
      }
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  logger.info('Socket.IO server initialized');
  return io;
}

/** Broadcasts a fresh top-N leaderboard slice to everyone subscribed to that game. */
function emitLeaderboardUpdate(game, leaderboard) {
  if (!io) return;
  io.to(gameRoom(game)).emit('leaderboard:update', { game, leaderboard });
}

function emitOverallLeaderboardUpdate(leaderboard) {
  if (!io) return;
  io.to(OVERALL_ROOM).emit('leaderboard:update', { game: 'overall', leaderboard });
}

function getIO() {
  if (!io) throw new Error('Socket.IO not initialized — call initSocket(server) first');
  return io;
}

module.exports = {
  initSocket,
  getIO,
  emitLeaderboardUpdate,
  emitOverallLeaderboardUpdate,
};
