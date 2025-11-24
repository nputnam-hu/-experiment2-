# Westeros Legal Assistant - Frontend

This is a React [Next.js](https://nextjs.org/) project using Chakra UI. It serves as the frontend client for the RAG Pipeline API.

## Project Structure

```
frontend/
├── app/                     # Next.js App Router pages
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Main chat interface
│   └── providers.tsx        # React Query & Chakra providers
├── components/              # UI Components
│   ├── CitationCard.tsx     # Displays individual source citations
│   ├── FeedbackControls.tsx # Thumbs up/down feedback UI
│   ├── HeaderNav.tsx        # Application header
│   ├── PdfViewer.tsx        # Modal PDF viewer
│   ├── ResultsDisplay.tsx   # Renders answer text and citations
│   ├── SearchInput.tsx      # Search bar and options
│   ├── Sidebar.tsx          # History sidebar
│   └── WelcomeScreen.tsx    # Initial empty state view
├── lib/                     # Utilities
│   └── api.ts               # API client and type definitions
└── public/                  # Static assets
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Configuration

The application expects the backend API to be running at `http://localhost:8000` during development.
Configuration can be managed via environment variables (e.g. `NEXT_PUBLIC_API_URL` in `.env.example`).
