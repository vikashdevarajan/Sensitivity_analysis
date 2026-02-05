

# Strategix: Game Theory Sensitivity Analyst

A professional full-stack application for zero-sum game analysis, providing Nash equilibrium calculations, sensitivity reports, and AI-driven strategic advisory with PDF export capabilities.

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI + Python + Google Gemini AI
- **Features**: Game theory calculations, AI strategic advisory, PDF export

## Quick Start

### Prerequisites
- **Node.js** (v16+ recommended)
- **Python** (3.8+ required)
- **Gemini API Key** (from Google AI Studio)

### Option 1: Automated Setup (Recommended)

**Windows:**
```bash
# Double-click or run in terminal
start-dev.bat
```

**Linux/macOS:**
```bash
# Make executable and run
chmod +x start-dev.sh
./start-dev.sh
```

### Option 2: Manual Setup

1. **Clone and Install Root Dependencies:**
   ```bash
   git clone <your-repo>
   cd Game_theory
   npm install
   ```

2. **Setup Frontend:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

3. **Setup Backend:**
   ```bash
   cd backend
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   # Linux/macOS  
   source venv/bin/activate
   
   pip install -r requirements.txt
   cd ..
   ```

4. **Configure Environment:**
   ```bash
   # Update backend/.env with your API key
   GEMINI_API_KEY=your_actual_api_key_here
   ```

5. **Start Services:**
   ```bash
   # Option 1: Start both together
   npm run dev
   
   # Option 2: Start individually
   # Terminal 1 - Backend
   npm run dev:backend
   
   # Terminal 2 - Frontend  
   npm run dev:frontend
   ```

## Access Points

- **Application**: http://localhost:3000
- **API Server**: http://localhost:8000  
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## API Endpoints

### `POST /analyze`
Analyzes game matrix and returns strategic recommendations.

**Request:**
```json
{
  "matrixData": {
    "rows": 2,
    "cols": 2, 
    "entityAName": "Your Company",
    "entityBName": "Competitor",
    "rowLabels": ["Strategy A", "Strategy B"],
    "colLabels": ["Response X", "Response Y"],
    "payoffs": [[10, -5], [-2, 8]]
  }
}
```

**Response:**
```json
{
  "results": {
    "gameValue": 2.5,
    "rowStrategies": [0.7, 0.3],
    "colStrategies": [0.6, 0.4],
    "isPure": false,
    "isMixed": true
  },
  "advisory": {
    "executiveSummary": "...",
    "strategicAdvisory": "...", 
    "recommendations": ["..."]
  }
}
```

## Usage Guide

1. **Setup Game Parameters:**
   - Entity names (your company vs competitor)
   - Strategy dimensions (2x2 to 6x6 matrix)
   - Strategy labels (meaningful names)
   - Payoff values (your outcomes for each scenario)

2. **Run Analysis:**
   - Click "Analyze Strategy" 
   - AI processes mathematical results
   - Receive executive summary and action steps

3. **Export Results:**
   - Click "Download PDF" for professional reports
   - Print-optimized formatting included

## Development

### Project Structure
```
├── frontend/                # React + TypeScript frontend
│   ├── src/
│   │   ├── App.tsx         # Main React component  
│   │   ├── types.ts        # TypeScript interfaces
│   │   ├── components/     # React components
│   │   └── services/       # API communication
│   ├── index.html          # HTML entry point
│   ├── package.json        # Frontend dependencies
│   └── vite.config.ts      # Vite configuration
├── backend/                # FastAPI Python backend
│   ├── main.py            # FastAPI application
│   ├── game_logic.py      # Game theory calculations  
│   ├── gemini_service.py  # AI advisory generation
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Backend environment variables
├── package.json           # Root workspace configuration
├── start-dev.bat         # Windows startup script
├── start-dev.sh          # Unix startup script
└── README.md
```

### Key Technologies
- **Game Theory**: Nash equilibrium, pure/mixed strategies
- **AI Integration**: Google Gemini for strategic interpretation  
- **Modern Stack**: React 19, FastAPI, TypeScript
- **Responsive Design**: Tailwind CSS, mobile-friendly

## Troubleshooting

**Backend not starting?**
- Verify Python 3.8+ installed: `python --version`
- Check API key in `backend/.env`
- Install dependencies: `pip install -r backend/requirements.txt`

**Frontend connection issues?**
- Ensure backend running on port 8000
- Check CORS settings in `backend/main.py`
- Verify Node.js installed: `node --version`

**Analysis failing?**
- Validate Gemini API key permissions
- Check network connectivity
- Review browser console for errors

