require('dotenv').config();
const express = require('express');
const cors = require('cors');

const usersRouter = require('./routes/users');
const activitiesRouter = require('./routes/activities');
const photosRouter = require('./routes/photos');
const adminRouter = require('./routes/admin');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/api', (req, res) => res.json({ status: 'ok' }));

app.use('/api/users', usersRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/photos', photosRouter);
app.use('/api/admin', adminRouter);

app.use((req, res) => res.status(404).json({ error: 'not found' }));

const port = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(port, () => console.log(`listening on ${port}`));
}

module.exports = app;
