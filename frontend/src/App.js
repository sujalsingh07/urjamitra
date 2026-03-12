import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Marketplace from './pages/Marketplace';
import MapView from './pages/MapView';
import Transactions from './pages/Transactions';
import Layout from './components/Layout';
import PageTransition from './components/PageTransition';
import 'leaflet/dist/leaflet.css';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/dashboard" element={
          <Layout>
            <PageTransition><Dashboard /></PageTransition>
          </Layout>
        } />
        <Route path="/marketplace" element={
          <Layout>
            <PageTransition><Marketplace /></PageTransition>
          </Layout>
        } />
        <Route path="/map" element={
          <Layout>
            <PageTransition><MapView /></PageTransition>
          </Layout>
        } />
        <Route path="/transactions" element={
          <Layout>
            <PageTransition><Transactions /></PageTransition>
          </Layout>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}

export default App;