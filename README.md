# Lumina Learning Analytics

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
```

## Current frontend

- Responsive student dashboard and analytics
- Study-material library and upload dialog
- Personalized quiz/practice center
- Interactive AI Tutor chat interface
- Personalized study roadmap
- Mock data for development before backend integration

## Backend integration

API calls should stay centralized in `src/services/api.js`. Set the FastAPI URL in
an `.env` file:

```env
VITE_API_URL=http://localhost:8000/api
```

Replace imports from `src/data/mockData.js` with data returned by the API service
as endpoints become available.
