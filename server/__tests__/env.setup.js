process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://placeholder/quirky-quest-test'; // overridden by in-memory server
process.env.ACCESS_TOKEN_SECRET = 'test-access-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
process.env.ACCESS_TOKEN_TTL = '15m';
process.env.REFRESH_TOKEN_TTL = '7d';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
