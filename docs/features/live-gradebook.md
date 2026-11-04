# Live gradebook

The committee gradebook opens a controlled session for a scheduled defense. Committee members enter rubric scores independently, while authorized participants see the current mean without seeing another member's private draft values unless policy permits it. The committee president reviews the computed average, closes the session, and approves the defense minutes. Closing locks scores, generates the minutes PDF, and emails results; subsequent corrections require an audited administrator process.

## Grading flow

```mermaid
sequenceDiagram
	participant M as Committee member
	participant P as President
	participant G as GradingSession
	participant R as Renderer
	participant S as Student

	M->>G: enter criterion scores (open)
	G-->>P: live mean
	P->>G: close session
	G->>G: lock scores
	G->>R: generate minutes PDF
	G-->>S: email result
```

## Mean computation

The computed mean follows the rubric weights:

$$
\\bar{g} = \\frac{\\sum_{i} w_i \\cdot g_i}{\\sum_{i} w_i}
$$
