import mongoose from 'mongoose';

const transcriptSchema = new mongoose.Schema(
	{
		title: { type: String },
		text: { type: String, required: true },
		wordCount: { type: Number },
		createdAt: { type: Date, default: Date.now }
	},
	{ collection: 'transcripts' }
);

export default mongoose.model('Transcript', transcriptSchema);