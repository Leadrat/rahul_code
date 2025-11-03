import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Demographics from './pages/Demographics';
import Housing from './pages/Housing';
import Workforce from './pages/Workforce';
import QAInterface from './pages/QAInterface';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/demographics" element={<Demographics />} />
          <Route path="/housing" element={<Housing />} />
          <Route path="/workforce" element={<Workforce />} />
          <Route path="/qa" element={<QAInterface />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
