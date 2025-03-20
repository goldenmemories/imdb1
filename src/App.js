import React from 'react';
import './App.css';
import IMDBDashboard from './components/IMDBDashboard';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>IMDB Top 1000 Movies Dashboard</h1>
      </header>
      <main>
        <IMDBDashboard />
      </main>
      <footer className="App-footer">
        <p>Data source: IMDB Top 1000 Movies</p>
      </footer>
    </div>
  );
}

export default App;
