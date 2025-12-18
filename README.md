# App2Widget

Generate React widgets from app metadata using AI.

## Quick Start

**Install:**
```bash
npm install
```

**Configure API** (create `.env`):
```env
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4
```

**Generate widget:**
```bash
npm run generate -- --app-id 0
npm run dev
```

Open http://localhost:5173

## How It Works

1. **Generate Data**: App metadata → LLM → `widget/response.json`
2. **Generate Component**: response.json → LLM → `widget/Widget.tsx`

## Commands

```bash
npm run generate -- --app-id <id>   # Generate widget
npm run dev                          # Start dev server
npm run build                        # Build for production
```

## Stack

React 19 • TypeScript • Tailwind CSS v3 • Vite • Recharts • Lucide Icons

## Customization

Edit prompts in `docs/prompts/`:
- `app2data.md` - Data generation
- `appdata2widget-ts.md` - Component generation
