# Specification Assistant Frontend (Svelte 5)

Modern frontend for the Specification Assistant application, built with Svelte 5 and SvelteKit.

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Backend server running on `http://localhost:8000`

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Features

- **Upload PDFs**: Drag-and-drop file upload with preview
- **Q&A Chat**: AI-powered question answering with streaming responses
- **Key Extraction**: Extract specific keys from PDFs using Excel templates or manual input
- **Persistent State**: Chat history and uploaded files persist across sessions

## Tech Stack

- Svelte 5 (with runes)
- SvelteKit 2
- Vite 5
- marked (Markdown rendering)

## Project Structure

```
src/
├── routes/              # SvelteKit routes
├── lib/
│   ├── components/      # Svelte components
│   ├── stores/          # State management
│   ├── api/             # API client
│   └── utils/           # Utilities
└── app.html             # HTML template
```

## Environment Variables

Create a `.env` file if you need to customize the API URL:

```env
VITE_API_URL=http://localhost:8000
```

## Documentation

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed documentation about the migration from vanilla JavaScript and architecture decisions.
