export const appConfig = () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3003,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
});
