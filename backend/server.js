import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import apiRouter from './src/routes/api.js';

const app = express();
const port = process.env.PORT || 8080;

app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*' }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
	console.error('MONGODB_URI not set');
	process.exit(1);
}

mongoose
	.connect(mongoUri, { dbName: process.env.MONGODB_DB || 'ai_meeting_summarizer' })
	.then(() => console.log('Connected to MongoDB'))
	.catch((err) => {
		console.error('MongoDB connection error', err);
		process.exit(1);
	});

app.get('/', (req, res) => {
	res.send({ status: 'ok', service: 'AI Meeting Summarizer API' });
});

app.use('/api', apiRouter);

app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});