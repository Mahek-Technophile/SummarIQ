import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema(
	{
		recipients: [{ type: String }],
		subject: { type: String },
		body: { type: String },
		summaryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Summary' },
		transcriptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transcript' },
		status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
		error: { type: String },
		createdAt: { type: Date, default: Date.now }
	},
	{ collection: 'emails' }
);

export default mongoose.model('EmailLog', emailLogSchema);