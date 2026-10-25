# Real-time interview assistant POC

A real-time assistant that transcribes interview questions as they are spoken and, once a question is complete, streams a short answer grounded in the candidate's context.

---

## 1. Architecture and data flow

```
[Browser Mic]
      |  (AudioWorklet 16kHz PCM chunks)
      v
[WebSocket (/ws/audio)]
      |
      v
[Vosk STT (KaldiRecognizer)] --> Emits interim & final transcripts to UI
      |
      v  (Final utterance)
[Orchestrator]
      |-- Audio energy tracking (speech-end timestamp)
      |-- 300ms debounce & sliding tail buffer
      |-- Question Classifier (LLM Structured Output)
      |     '-- Filter: small-talk / filler / duplicate suppression
      |
      v  (Valid question detected)
[Answer Generator (LLM)] --> Token-by-token stream (`answer_delta`) to UI
```

---

## 2. Setup and run

### Prerequisites

- Node.js 20+ and npm
- Python 3.11+ and [uv](https://docs.astral.sh/uv/), or Docker
- Ollama running locally, or an OpenAI API key

### Option A: Docker Compose

This is the easiest route on a clean machine.

```bash
# Prepare environment files
cp backend/.env.example backend/.env.local
cp frontend/.env.example frontend/.env.local

# In backend/.env.local, set the Docker host URL for Ollama:
# OLLAMA_BASE_URL=http://host.docker.internal:11434

# Build and run
docker compose up --build
```

- Backend: `http://localhost:8000` (WebSocket at `ws://localhost:8000/ws/audio`)
- Frontend: `http://localhost:3000`

### Option B: Run locally

Backend:

```bash
cd backend
cp .env.example .env.local

# If using OpenAI: set LLM_PROVIDER=openai and OPENAI_API_KEY in .env.local
# If using Ollama: make sure it is running, pull any model you like
# (for example: ollama pull qwen3.5), then set OLLAMA_MODEL=qwen3.5 in .env.local

uv sync
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Frontend:

```bash
cd frontend
cp .env.example .env.local

npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

---

## 3. Key decisions and trade-offs

| Decision           | Choice                                | Reasoning and cost                                                                                                                                                                                                                                      |
| :----------------- | :------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| STT provider       | Vosk (offline)                        | Runs locally with no API latency or cost, and needs no external account. The cost is accuracy: on noisy audio and accents it falls behind cloud providers like Deepgram Nova-2.                                                                         |
| LLM provider       | Ollama                                | Free local inference with no network calls. It also supports OpenAI, so one can switch to OpenAI or an OpenAI-compatible API.                                                                                                                           |
| Question detection | Energy peak, debounce, structured LLM | Audio energy marks when speech ends, and a 300ms debounce stops the assistant from cutting in mid-sentence. A structured LLM classifier then reads the noisy, unpunctuated transcript and drops small talk, backchannel filler, and repeated questions. |
| Answer format      | Strict bullet limit                   | The system prompt caps answers at 3 to 5 bullets (under 80 words total) and restricts them to the supplied resume and job description, which limits hallucination during live calls.                                                                    |

---

## 4. Known limitations

- Capture is single-channel, from the browser mic only. In a virtual call, the interviewer's audio has to reach the mic through speakers or be routed through a virtual audio device.
- The small offline Vosk model (`vosk-model-small-en-in-0.4`) sometimes misrecognizes technical terms.
- Local Ollama speed depends on your hardware and can be slow on some machines. But there is an OpenAI-compatible API as well to switch to.

---

## 5. What I would build next, given another week

1. System and tab audio capture. Add `getDisplayMedia` alongside the mic, with separate tracks for interviewer and candidate.
2. Conversation history. Keep multi-turn memory so follow-up questions can refer to earlier answers.
3. Answer modes. Add a toggle between concise bullets and full answers that can be read aloud.
4. Questions for the interviewer. Suggest questions the candidate can ask at the end.
