# App2Widget

AI-powered mobile widget generator with live preview and multiple LLM provider support.

## Features

- 🤖 **AI Widget Generation** - Generate widgets from app descriptions or IDs
- 📱 **Live Preview** - Real-time widget rendering with Sandpack
- 🎨 **Multiple Styles** - Modern, Enterprise, and Vibrant UI themes
- 🔌 **Multi-Provider** - Support for Doubao, Qwen, OpenAI, and custom LLMs
- 💾 **Chat History** - Persistent sessions with PostgreSQL
- ⚡ **Fast & Modern** - Built with Next.js 14, React 18, and TypeScript

## Tech Stack

- **Framework**: Next.js 14, React 18, TypeScript
- **UI**: Material-UI v5, Tailwind CSS
- **Database**: PostgreSQL + Prisma ORM
- **Preview**: Sandpack (CodeSandbox)
- **AI**: OpenAI-compatible API

## Quick Start

### Prerequisites

- Node.js 18+
- Docker (for database)

### Installation

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Start PostgreSQL database**
   ```bash
   docker run -d \
     --name app2widget-postgres \
     -e POSTGRES_USER=user \
     -e POSTGRES_PASSWORD=password \
     -e POSTGRES_DB=app2widget \
     -p 5432:5432 \
     postgres:15-alpine
   ```

3. **Setup database**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Open http://localhost:3000

## Configuration

Click the settings icon (⚙️) to configure your LLM provider:

### Supported Providers

| Provider | Base URL | Models |
|----------|----------|--------|
| **Doubao** | `https://ark.cn-beijing.volces.com/api/v3/chat/completions` | `doubao-seed-1-8-251215` |
| **Qwen** | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `qwen3-max`, `qwen3-coder-plus` |
| **OpenAI** | `https://api.openai.com/v1` | `GPT-5.2`, `GPT-5.2 pro`, `GPT-5 mini` |
| **Custom** | Your URL | Your model |

## Usage

1. **Configure** - Set up your LLM provider and API key
2. **Choose Mode** - App Description or App ID
3. **Select Style** - Modern, Enterprise, or Vibrant
4. **Generate** - Enter input and create your widget
5. **Preview** - View live widget with mock data

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Deploy with PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "app2widget" -- start

# View status
pm2 status

# View logs
pm2 logs app2widget

# Auto-start on reboot
pm2 startup
pm2 save
```

### Access

- **Local**: http://localhost:3000
- **Server**: http://YOUR_SERVER_IP:3000

**Note**: Ensure port 3000 is open in your firewall and cloud security group.

## Project Structure

```
app2widget/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API endpoints
│   │   │   ├── chat/           # Main orchestration
│   │   │   ├── generate/       # Mock data & widget generation
│   │   │   └── apps/           # App metadata
│   │   └── page.tsx            # Home page
│   ├── components/
│   │   ├── chat/               # Chat UI
│   │   ├── widget/             # Widget preview
│   │   └── settings/           # LLM configuration
│   ├── lib/
│   │   ├── llm/                # LLM client & prompts
│   │   └── prompts/            # Prompt templates
│   └── types/                  # TypeScript definitions
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Seed data
└── package.json
```

## Database Schema

### ChatSession
Stores complete widget generation flows including mode, input, UI style, mock data, and widget code.

### ChatMessage
Individual messages in a session with types: input, text, mock-data, widget-code, error.

### UIStylePreset
Predefined UI style configurations with prompt templates.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed database with presets |

## Troubleshooting

### Database Connection Error

```bash
# Check if container is running
docker ps

# Start container
docker start app2widget-postgres
```

### Port Already in Use

Next.js automatically tries port 3001 if 3000 is occupied.

### Build Errors

```bash
rm -rf .next
npm run build
```

## License

MIT
