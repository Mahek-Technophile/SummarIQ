import { Router } from 'express';
import Transcript from '../models/Transcript.js';
import Summary from '../models/Summary.js';
import EmailLog from '../models/EmailLog.js';
import { summarizeWithAI } from '../services/ai.js';
import { sendSummaryEmail } from '../services/email.js';
import { countWords, extractKeywords, wordReduction } from '../utils/analytics.js';

const router = Router();

// 1. POST /uploadTranscript → Save transcript to DB.
router.post('/uploadTranscript', async (req, res) => {
	try {
		const { transcriptText, title } = req.body || {};
		if (!transcriptText || typeof transcriptText !== 'string' || transcriptText.trim().length === 0) {
			return res.status(400).json({ error: 'transcriptText is required' });
		}
		const doc = await Transcript.create({
			title: title || 'Untitled Meeting',
			text: transcriptText,
			wordCount: countWords(transcriptText)
		});
		return res.json({ transcriptId: doc._id.toString(), createdAt: doc.createdAt });
	} catch (err) {
		console.error('uploadTranscript error', err);
		return res.status(500).json({ error: 'Failed to save transcript' });
	}
});

// 2. POST /summarize → Call Groq API (primary) with transcript + prompt. Fallback to OpenAI.
router.post('/summarize', async (req, res) => {
	try {
		const { transcriptId, transcriptText, prompt, mode } = req.body || {};
		let text = transcriptText;
		if (!text && transcriptId) {
			const doc = await Transcript.findById(transcriptId).lean();
			if (!doc) return res.status(404).json({ error: 'Transcript not found' });
			text = doc.text;
		}
		if (!text) return res.status(400).json({ error: 'Provide transcriptText or transcriptId' });

		const result = await summarizeWithAI({ transcriptText: text, userPrompt: prompt || '', mode: mode || 'custom' });
		return res.json({ summaryText: result.text, modelUsed: result.modelUsed, promptUsed: result.promptUsed });
	} catch (err) {
		console.error('summarize error', err);
		return res.status(500).json({ error: 'Failed to generate summary' });
	}
});

// 3. POST /saveSummary → Save edited summary to DB.
router.post('/saveSummary', async (req, res) => {
	try {
		const { transcriptId, summaryText, mode, promptUsed, modelUsed } = req.body || {};
		if (!summaryText || typeof summaryText !== 'string') return res.status(400).json({ error: 'summaryText is required' });
		const summary = await Summary.create({
			transcriptId: transcriptId || undefined,
			text: summaryText,
			mode: mode || 'custom',
			promptUsed: promptUsed || '',
			modelUsed: modelUsed || ''
		});
		return res.json({ summaryId: summary._id.toString(), createdAt: summary.createdAt });
	} catch (err) {
		console.error('saveSummary error', err);
		return res.status(500).json({ error: 'Failed to save summary' });
	}
});

// 4. POST /sendEmail → Send summary to recipients via Nodemailer.
router.post('/sendEmail', async (req, res) => {
	try {
		let { recipients, subject, summaryText, transcriptId, summaryId } = req.body || {};
		if (!summaryText) return res.status(400).json({ error: 'summaryText is required' });
		if (typeof recipients === 'string') {
			recipients = recipients.split(',').map((r) => r.trim()).filter(Boolean);
		}
		if (!Array.isArray(recipients) || recipients.length === 0) return res.status(400).json({ error: 'recipients is required' });

		subject = subject || 'AI Meeting Summary';
		const html = `<div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5"><h2>${subject}</h2><pre style="white-space:pre-wrap">${summaryText}</pre></div>`;
		const info = await sendSummaryEmail({ recipients, subject, body: html });

		await EmailLog.create({
			recipients,
			subject,
			body: summaryText,
			transcriptId: transcriptId || undefined,
			summaryId: summaryId || undefined,
			status: 'sent'
		});

		return res.json({ status: 'sent', messageId: info.messageId });
	} catch (err) {
		console.error('sendEmail error', err);
		try {
			await EmailLog.create({
				recipients: req.body?.recipients || [],
				subject: req.body?.subject || 'AI Meeting Summary',
				body: req.body?.summaryText || '',
				transcriptId: req.body?.transcriptId || undefined,
				summaryId: req.body?.summaryId || undefined,
				status: 'failed',
				error: err?.message || String(err)
			});
		} catch (_) {}
		return res.status(500).json({ error: 'Failed to send email' });
	}
});

// 5. (Optional) GET /analytics → Return word count reduction and extracted keywords.
router.get('/analytics', async (req, res) => {
	try {
		const { transcriptId, summaryId, transcriptText, summaryText } = req.query || {};
		let orig = transcriptText;
		let summ = summaryText;

		if (transcriptId && !orig) {
			const t = await Transcript.findById(transcriptId).lean();
			orig = t?.text || '';
		}
		if (summaryId && !summ) {
			const s = await Summary.findById(summaryId).lean();
			summ = s?.text || '';
		}
		if (!orig || !summ) return res.status(400).json({ error: 'Provide transcriptId/summaryId or transcriptText/summaryText' });

		const reduction = wordReduction(orig, summ);
		const keywords = extractKeywords(orig);
		return res.json({ reduction, keywords });
	} catch (err) {
		console.error('analytics error', err);
		return res.status(500).json({ error: 'Failed to compute analytics' });
	}
});

export default router;