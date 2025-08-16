import React, { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api'

async function api(path, options = {}) {
	const res = await fetch(`${API_BASE}${path}`, {
		method: options.method || 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: options.body ? JSON.stringify(options.body) : undefined,
	})
	if (!res.ok) throw new Error(`Request failed: ${res.status}`)
	return res.json()
}

export default function App() {
	const [transcriptText, setTranscriptText] = useState('')
	const [title, setTitle] = useState('')
	const [prompt, setPrompt] = useState('')
	const [mode, setMode] = useState('custom')
	const [summaryText, setSummaryText] = useState('')
	const [transcriptId, setTranscriptId] = useState(null)
	const [summaryId, setSummaryId] = useState(null)
	const [emails, setEmails] = useState('')
	const [loading, setLoading] = useState(false)
	const [modelUsed, setModelUsed] = useState('')

	function handleFile(e) {
		const file = e.target.files?.[0]
		if (!file) return
		if (!file.name.endsWith('.txt')) {
			alert('Please upload a .txt file')
			return
		}
		const reader = new FileReader()
		reader.onload = () => {
			setTranscriptText(String(reader.result || ''))
		}
		reader.readAsText(file)
	}

	async function uploadTranscript() {
		if (!transcriptText.trim()) return alert('Enter or upload transcript text')
		setLoading(true)
		try {
			const data = await api('/uploadTranscript', { body: { transcriptText, title } })
			setTranscriptId(data.transcriptId)
			alert('Transcript saved')
		} catch (e) {
			alert(e.message)
		} finally {
			setLoading(false)
		}
	}

	async function generateSummary(nextMode = mode) {
		if (!transcriptText.trim() && !transcriptId) return alert('Provide transcript or save it first')
		setLoading(true)
		try {
			const data = await api('/summarize', { body: { transcriptId, transcriptText, prompt, mode: nextMode } })
			setSummaryText(data.summaryText || '')
			setModelUsed(data.modelUsed || '')
			setMode(nextMode)
		} catch (e) {
			alert(e.message)
		} finally {
			setLoading(false)
		}
	}

	async function saveEdits() {
		if (!summaryText.trim()) return alert('Nothing to save')
		setLoading(true)
		try {
			const data = await api('/saveSummary', { body: { transcriptId, summaryText, mode, promptUsed: prompt, modelUsed } })
			setSummaryId(data.summaryId)
			alert('Summary saved')
		} catch (e) {
			alert(e.message)
		} finally {
			setLoading(false)
		}
	}

	async function shareEmail() {
		if (!summaryText.trim()) return alert('Generate or paste a summary first')
		const recipients = emails.split(',').map((e) => e.trim()).filter(Boolean)
		if (recipients.length === 0) return alert('Enter at least one email')
		setLoading(true)
		try {
			await api('/sendEmail', { body: { recipients, subject: title || 'AI Meeting Summary', summaryText, transcriptId, summaryId } })
			alert('Email sent')
		} catch (e) {
			alert(e.message)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div style={{ maxWidth: 900, margin: '20px auto', fontFamily: 'system-ui, Arial, sans-serif' }}>
			<h2>AI Meeting Summarizer</h2>
			<div style={{ display: 'grid', gap: 12 }}>
				<label>
					Meeting Title
					<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Weekly Standup" style={{ width: '100%', padding: 8 }} />
				</label>

				<label>
					Transcript (.txt) or paste below
					<input type="file" accept=".txt" onChange={handleFile} />
				</label>
				<textarea value={transcriptText} onChange={(e) => setTranscriptText(e.target.value)} placeholder="Paste transcript here..." rows={10} style={{ width: '100%', padding: 8 }} />
				<button onClick={uploadTranscript} disabled={loading}>
					Save Transcript
				</button>

				<label>
					Custom Instruction / Prompt
					<textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., Focus on decisions and risks" rows={4} style={{ width: '100%', padding: 8 }} />
				</label>

				<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
					<button onClick={() => generateSummary('custom')} disabled={loading}>Generate Summary</button>
					<button onClick={() => generateSummary('concise')} disabled={loading}>Concise Summary</button>
					<button onClick={() => generateSummary('detailed')} disabled={loading}>Detailed Summary</button>
					<button onClick={() => generateSummary('actions')} disabled={loading}>Action Items</button>
				</div>

				<label>
					AI-generated Summary (editable)
					<textarea value={summaryText} onChange={(e) => setSummaryText(e.target.value)} placeholder="Summary will appear here..." rows={10} style={{ width: '100%', padding: 8 }} />
				</label>
				<button onClick={saveEdits} disabled={loading}>Save Edits</button>

				<label>
					Recipient Email(s) — comma separated
					<input value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="a@x.com, b@y.com" style={{ width: '100%', padding: 8 }} />
				</label>
				<button onClick={shareEmail} disabled={loading}>Share via Email</button>

				{modelUsed ? <div style={{ fontSize: 12, color: '#666' }}>Model: {modelUsed}</div> : null}
				{loading ? <div>Loading...</div> : null}
			</div>
		</div>
	)
}