import mongoose from 'mongoose';

// readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
export const getHealth = (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'ok' : 'error',
    db: isDbConnected ? 'connected' : 'disconnected',
  });
};
