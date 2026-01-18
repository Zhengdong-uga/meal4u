import * as React from 'react';
import MainContainer from './navigation/MainContainer';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <MainContainer/>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;