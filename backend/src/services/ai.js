import Groq from 'groq-sdk';
import OpenAI from 'openai';

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

function buildPrompt(transcriptText, userPrompt, mode) {
	const baseInstruction = 'You are an expert meeting summarizer. Generate a clear, structured summary.';
	const modeInstruction =
		mode === 'concise'
			? 'Keep it concise (100-200 words).'
			: mode === 'detailed'
			? 'Provide a detailed summary with sections: Overview, Key Decisions, Discussion Points, Risks, Next Steps.'
			: mode === 'actions'
			? 'Extract action items as bullet points with owner and due date if mentioned.'
			: '';
	const safety = 'Avoid hallucinations. Use only information present in the transcript. Use neutral tone.';
	const custom = userPrompt ? `User instructions: ${userPrompt}` : '';
	return `${baseInstruction}\n${modeInstruction}\n${safety}\n${custom}\nTranscript:\n\"\"\"${transcriptText}\"\"\"`;
}

export async function summarizeWithAI({ transcriptText, userPrompt = '', mode = 'custom' }) {
	const prompt = buildPrompt(transcriptText, userPrompt, mode);
	const groqModel = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';
	const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';

	if (groq) {
		try {
			const completion = await groq.chat.completions.create({
				model: groqModel,
				messages: [{ role: 'user', content: prompt }],
				temperature: 0.2,
				max_tokens: 1200
			});
			const text = completion.choices?.[0]?.message?.content?.trim();
			if (text) return { text, modelUsed: `groq:${groqModel}`, promptUsed: prompt };
		} catch (err) {
			console.error('Groq summarize error:', err?.message || err);
		}
	}

	if (openai) {
		const completion = await openai.chat.completions.create({
			model: openaiModel,
			messages: [{ role: 'user', content: prompt }],
			temperature: 0.2,
			max_tokens: 1200
		});
		const text = completion.choices?.[0]?.message?.content?.trim();
		if (text) return { text, modelUsed: `openai:${openaiModel}`, promptUsed: prompt };
	}

	throw new Error('No AI provider configured or all providers failed');
}