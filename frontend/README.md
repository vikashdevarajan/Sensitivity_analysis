# Strategix Frontend

React + TypeScript frontend for the Strategix Game Theory Analyst application.

## Technologies

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and development server
- **Tailwind CSS** - Styling framework
- **Recharts** - Data visualization
- **Lucide React** - Icons

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
├── App.tsx              # Main application component
├── index.tsx            # React entry point
├── index.html           # HTML template
├── types.ts             # TypeScript type definitions
├── components/          # React components
│   └── BackendStatus.tsx
├── services/            # API communication
│   └── apiService.ts
└── utils/              # Utility functions
    └── gameLogic.ts
```

## API Integration

The frontend communicates with the FastAPI backend via REST API:

- **Base URL**: `http://localhost:8000`
- **Main Endpoint**: `POST /analyze` - Analyzes game matrix
- **Health Check**: `GET /health` - Backend status

## Features

- Interactive game matrix input
- Real-time backend connectivity status
- Strategic analysis visualization
- PDF export capabilities
- Responsive design for mobile/desktop