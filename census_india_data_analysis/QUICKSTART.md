# Quick Start Guide

## First Time Setup

1. **Run the setup script**:
   ```bash
   setup.bat
   ```
   This will:
   - Create a Python virtual environment (`.venv`)
   - Install all Python dependencies
   - Install all Node.js dependencies

## Running the Application

### Option 1: Using Batch Scripts (Recommended for Windows)

1. **Start the backend** (in one terminal):
   ```bash
   start-backend.bat
   ```

2. **Start the frontend** (in another terminal):
   ```bash
   start-frontend.bat
   ```

### Option 2: Manual Commands

1. **Start the backend**:
   ```bash
   # Activate virtual environment
   .venv\Scripts\activate
   
   # Start Flask server
   cd backend
   python app.py
   ```

2. **Start the frontend**:
   ```bash
   # In a new terminal
   cd frontend
   npm start
   ```

## Accessing the Application

- **Frontend**: Open your browser to `http://localhost:3000`
- **Backend API**: Available at `http://localhost:5000/api`

## Navigation

The application has 5 main sections accessible from the sidebar:

1. **Overview** - Dataset summary and key metrics
2. **Demographics** - Population and literacy analysis
3. **Housing** - Infrastructure and urbanisation data
4. **Workforce** - Employment statistics
5. **Ask Questions** - AI-powered Q&A interface

## Troubleshooting

### Backend Issues

- **Port 5000 already in use**: Change the port in `backend/app.py` (last line)
- **Module not found**: Make sure virtual environment is activated and dependencies are installed
- **Data files not found**: Ensure CSV files are in the project root directory

### Frontend Issues

- **Port 3000 already in use**: The app will prompt you to use a different port
- **npm install fails**: Try deleting `node_modules` and `package-lock.json`, then run `npm install` again
- **API connection error**: Make sure the backend is running on port 5000

### Common Fixes

1. **Reinstall dependencies**:
   ```bash
   # Python
   .venv\Scripts\activate
   pip install -r requirements.txt --force-reinstall
   
   # Node.js
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check if ports are available**:
   ```bash
   # Check port 5000
   netstat -ano | findstr :5000
   
   # Check port 3000
   netstat -ano | findstr :3000
   ```

## Example Questions for Q&A

Try asking these questions in the Q&A interface:

- "What is the total population?"
- "Which states have the highest literacy rate?"
- "Show me internet connectivity statistics"
- "What is the average worker participation rate?"
- "Which states are most urbanized?"
- "What is the gender distribution of workers?"

## Next Steps

- Explore different sections of the dashboard
- Try the interactive charts
- Ask questions in the Q&A interface
- Check the full README.md for detailed documentation
