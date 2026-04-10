const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { PORT } = require('./config/env');
const Reservation = require('./models/Reservation');

const server = http.createServer(app);

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(` Server is running on port ${PORT}`);
      
      // Background Sweeper: Auto-cancel pending reservations older than 30 mins
      setInterval(async () => {
        try {
          const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
          const result = await Reservation.updateMany(
            { status: 'pending', createdAt: { $lt: thirtyMinsAgo } },
            { $set: { status: 'cancelled' } }
          );
          if (result.modifiedCount > 0) {
            console.log(` Auto-cancelled ${result.modifiedCount} expired pending reservations.`);
          }
        } catch (err) {
          console.error('Sweeper error:', err);
        }
      }, 60 * 1000); // Check every 1 minute
      
    });
  } catch (error) {
    console.error(' Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  server.close(() => process.exit(1));
});
