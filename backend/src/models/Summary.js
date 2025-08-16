import mongoose from 'mongoose';

const summarySchema = new mongoose.Schema(
	{
		transcriptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transcript' },
		text: { type: String, required: true },
		mode: { type: String, enum: ['concise', 'detailed', 'actions', 'custom'], default: 'custom' },
		promptUsed: { type: String },
		modelUsed: { type: String },
		createdAt: { type: Date, default: Date.now }
	},
	{ collection: 'summaries' }
);

export default mongoose.model('Summary', summarySchema);