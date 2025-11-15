const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(morgan('dev'));

app.use('/api', routes);

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Futsal Reservation System Backend' });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
