import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Building2, Briefcase, MessageSquare, Menu, X, Brain } from 'lucide-react';
import './Layout.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Overview' },
    { path: '/demographics', icon: Users, label: 'Demographics' },
    { path: '/housing', icon: Building2, label: 'Housing' },
    { path: '/workforce', icon: Briefcase, label: 'Workforce' },
    { path: '/ml-insights', icon: Brain, label: 'ML Insights' },
    { path: '/qa', icon: MessageSquare, label: 'Ask Questions' },
  ];

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">
            {sidebarOpen ? 'ML Data Analysis' : 'ML'}
          </h1>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
      
      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
