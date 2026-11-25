# StudyPilot

Frontend for the AI-Powered Learning Analytics & Personalized Study Assistant.

## Run locally

```bash
npm install
npm run dev
```

## Checks

```bash
npm run lint
npm run build
node --test tests/*.test.mjs
```

## Backend integration

Set the FastAPI base URL and the guided study flag in an `.env.local` file:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_GUIDED_STUDY_ENABLED=true
```

Guided study defaults to on in Vite development unless explicitly set to
`false`. Other builds require `true` and a backend that serves the guided
study and analytics endpoints. With guided study disabled, document opens and
the dashboard keep their legacy behavior.

Guided section and part links use `/library/:id?tool=study&section=:id&part=:id`.
The Summary, Flashcards, Quiz, and Roadmap tools retain their explicit query
links. Legacy `/library/:id/text` links always open Summary.
