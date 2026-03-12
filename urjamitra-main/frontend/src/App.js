import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import MapView from "./pages/MapView";
import Transactions from "./pages/Transactions";
import ChatPage from "./pages/ChatPage";

import Layout from "./components/Layout";
import PageTransition from "./components/PageTransition";

import "leaflet/dist/leaflet.css";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>

        {/* LOGIN */}
        <Route
          path="/"
          element={
            <PageTransition>
              <Login />
            </PageTransition>
          }
        />

        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            <Layout>
              <PageTransition>
                <Dashboard />
              </PageTransition>
            </Layout>
          }
        />

        {/* MARKETPLACE */}
        <Route
          path="/marketplace"
          element={
            <Layout>
              <PageTransition>
                <Marketplace />
              </PageTransition>
            </Layout>
          }
        />

        {/* MAP VIEW */}
        <Route
          path="/map"
          element={
            <Layout>
              <PageTransition>
                <MapView />
              </PageTransition>
            </Layout>
          }
        />

        {/* TRANSACTIONS */}
        <Route
          path="/transactions"
          element={
            <Layout>
              <PageTransition>
                <Transactions />
              </PageTransition>
            </Layout>
          }
        />

        {/* CHAT PAGE */}
        <Route
          path="/chat"
          element={
            <Layout>
              <PageTransition>
                <ChatPage />
              </PageTransition>
            </Layout>
          }
        />

      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}