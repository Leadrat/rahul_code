# ML Data Analysis Dashboard

A full-stack web application for analyzing India's 2011 Census housing and demographic data with an AI-powered Q&A interface.

## Features

- **Multi-page Report Dashboard**: Interactive visualizations across different sections
  - Overview: Key statistics and dataset summary
  - Demographics: Population, literacy, and sex ratio analysis
  - Housing: Infrastructure and urbanisation patterns
  - Workforce: Employment and worker participation analysis
  
- **AI-Powered Q&A Interface**: Ask natural language questions about the dataset
  - Get instant answers with text responses
  - View detailed tables and statistics
  - Interactive conversation history

- **Modern Tech Stack**:
  - Frontend: React.js with React Router, Plotly, Recharts
  - Backend: Python Flask with REST API
  - NLP: spaCy for question understanding (extensible)
  - Data Processing: Pandas, NumPy, Matplotlib, Seaborn

## Project Structure

```
ml_data_analysis/
├── backend/
│   └── app.py                 # Flask API server
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.js      # Main layout with sidebar
│   │   │   └── Layout.css
│   │   ├── pages/
│   │   │   ├── Overview.js    # Overview page
│   │   │   ├── Demographics.js # Demographics analysis
│   │   │   ├── Housing.js     # Housing & infrastructure
│   │   │   ├── Workforce.js   # Workforce analysis
│   │   │   ├── QAInterface.js # Q&A chat interface
│   │   │   └── QAInterface.css
│   │   ├── services/
│   │   │   └── api.js         # API service layer
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
├── src/
│   └── data_analysis.py       # Data loading utilities
├── reports/                   # Generated reports and charts
├── requirements.txt           # Python dependencies
└── README.md
```

## Setup Instructions

### Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn

### Backend Setup

1. **Create and activate virtual environment**:
   ```bash
   python -m venv .venv
   
   # On Windows:
   .venv\Scripts\activate
   
   # On macOS/Linux:
   source .venv/bin/activate
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Download spaCy language model** (optional, for enhanced NLP):
   ```bash
   python -m spacy download en_core_web_sm
   ```

4. **Start the Flask backend**:
   ```bash
   cd backend
   python app.py
   ```
   
   The backend will run on `http://localhost:5000`

### Frontend Setup

1. **Install Node.js dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start the React development server**:
   ```bash
   npm start
   ```
   
   The frontend will run on `http://localhost:3000`

## Usage

1. **Start the backend server** (in one terminal):
   ```bash
   # From project root
   .venv\Scripts\activate  # Windows
   cd backend
   python app.py
   ```

2. **Start the frontend server** (in another terminal):
   ```bash
   # From project root
   cd frontend
   npm start
   ```

3. **Open your browser** and navigate to `http://localhost:3000`

4. **Explore the dashboard**:
   - Use the sidebar to navigate between different sections
   - View interactive charts and statistics
   - Go to "Ask Questions" to interact with the Q&A interface

## API Endpoints

### Data Endpoints
- `GET /api/health` - Health check
- `GET /api/overview` - Overview statistics
- `GET /api/demographics` - Demographics data
- `GET /api/housing` - Housing and infrastructure data
- `GET /api/workforce` - Workforce analysis data
- `GET /api/states` - List of all states
- `GET /api/state/<state_name>` - Detailed state information

### Chart Endpoints
- `GET /api/charts/plotly/population_map` - Population distribution chart
- `GET /api/charts/plotly/literacy_scatter` - Literacy vs workforce scatter plot
- `GET /api/charts/plotly/sex_ratio_box` - Sex ratio box plot
- `GET /api/charts/plotly/urbanisation_pie` - Urban vs rural pie chart

### Q&A Endpoint
- `POST /api/qa` - Ask questions about the dataset
  ```json
  {
    "question": "What is the total population?"
  }
  ```

## Example Questions for Q&A

- "What is the total population?"
- "Which states have the highest literacy rate?"
- "How many districts are in the dataset?"
- "What is the average worker participation rate?"
- "Show me internet connectivity statistics"
- "Which states are most urbanized?"
- "What is the gender distribution of workers?"

## Technologies Used

### Frontend
- **React 18**: UI framework
- **React Router**: Navigation
- **Plotly.js**: Interactive charts
- **Recharts**: Additional charting library
- **Lucide React**: Icon library
- **Axios**: HTTP client

### Backend
- **Flask**: Web framework
- **Flask-CORS**: Cross-origin resource sharing
- **Pandas**: Data manipulation
- **NumPy**: Numerical computing
- **Matplotlib & Seaborn**: Static visualizations
- **Plotly**: Interactive visualizations
- **spaCy**: Natural language processing (extensible)

## Future Enhancements

- Enhanced spaCy NLP integration for more complex queries
- Export reports to PDF
- Data filtering and custom date ranges
- User authentication and saved queries
- Real-time data updates
- More advanced visualizations
- Machine learning predictions

## License

This project is for educational purposes.

## Data Source

India Census 2011 - Housing and Demographic Data
