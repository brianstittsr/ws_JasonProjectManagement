import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { plugins } from '@/plugins';
import ErrorBoundary from './components/common/ErrorBoundary';
import { FirebaseProvider } from './firebase';

function App() {
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to={plugins[0]?.route || '/'} replace />} />
            {plugins.map(plugin => (
              <Route
                key={plugin.id}
                path={plugin.route}
                element={
                  <ErrorBoundary fallback={<div className="p-4">{`Error loading ${plugin.name}`}</div>}>
                    <plugin.component />
                  </ErrorBoundary>
                }
              />
            ))}
          </Routes>
        </Router>
      </FirebaseProvider>
    </ErrorBoundary>
  );
}

export default App;
