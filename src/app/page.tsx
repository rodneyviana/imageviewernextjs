"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import MainExplorer from "./MainExplorer";
import ErrorBoundary from "./components/ErrorBoundary";

// Dynamically import the modern component with error boundary
const ModernMainExplorer = dynamic(
  () => import('./components/ModernMainExplorer'),
  {
    loading: () => (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f5f7fa',
        color: '#2c3e50',
        fontSize: '1.2rem'
      }}>
        <div>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }} />
          Loading Modern Interface...
        </div>
      </div>
    ),
    ssr: false
  }
);

export default function Home() {
  const [useModern, setUseModern] = useState(true);

  if (!useModern) {
    return (
      <div>
        <div style={{
          padding: '1rem',
          backgroundColor: '#d1ecf1',
          border: '1px solid #bee5eb',
          borderRadius: '8px',
          margin: '1rem',
          color: '#0c5460',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Using Classic Interface</span>
          <button 
            onClick={() => setUseModern(true)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Switch to Modern
          </button>
        </div>
        <MainExplorer />
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div style={{
          padding: '2rem',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          margin: '2rem',
          color: '#856404'
        }}>
          <h3>Modern Interface Error</h3>
          <p>Falling back to classic interface due to an error.</p>
          <button 
            onClick={() => setUseModern(false)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Use Classic Interface
          </button>
        </div>
      }
    >
      <div>
        <ModernMainExplorer />
      </div>
    </ErrorBoundary>
  );
}
