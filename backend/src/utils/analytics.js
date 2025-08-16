export function countWords(text) {
	return text?.trim()?.split(/\s+/)?.filter(Boolean)?.length || 0;
}

export function extractKeywords(text, maxKeywords = 12) {
	const stopwords = new Set([
		'the', 'and', 'a', 'an', 'to', 'in', 'of', 'for', 'on', 'at', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
		'by', 'with', 'as', 'that', 'this', 'it', 'from', 'or', 'we', 'our', 'you', 'your', 'they', 'their', 'i', 'me',
		'my', 'mine', 'he', 'she', 'his', 'her', 'them', 'but', 'if', 'not', 'so', 'do', 'does', 'did', 'done', 'have',
		'has', 'had'
	]);
	const frequency = new Map();
	const words = text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(Boolean);
	for (const word of words) {
		if (stopwords.has(word) || word.length <= 2) continue;
		frequency.set(word, (frequency.get(word) || 0) + 1);
	}
	return [...frequency.entries()].sort((a, b) => b[1] - a[1]).slice(0, maxKeywords).map(([w]) => w);
}

export function wordReduction(original, summary) {
	const originalWords = countWords(original);
	const summaryWords = countWords(summary);
	const reduction = originalWords > 0 ? Math.round(100 - (summaryWords / originalWords) * 100) : 0;
	return { originalWords, summaryWords, reductionPercent: reduction };
}