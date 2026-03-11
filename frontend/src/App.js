import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Marketplace from './pages/Marketplace';
import MapView from './pages/MapView';
import Transactions from './pages/Transactions';
import Navbar from './components/Navbar';
import 'leaflet/dist/leaflet.css';

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={
          <>
            <Navbar />
            <Dashboard />
          </>
        } />
        <Route path="/marketplace" element={
          <>
            <Navbar />
            <Marketplace />
          </>
        } />
        <Route path="/map" element={
          <>
            <Navbar />
            <MapView />
          </>
        } />
        <Route path="/transactions" element={
          <>
            <Navbar />
            <Transactions />
          </>
        } />
      </Routes>
    </Router>
  );
}

export default App;