import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import MapView from "./pages/MapView";
import Transactions from "./pages/Transactions";
import Messages from "./pages/Messages";
import Layout from "./components/Layout";
import PageTransition from "./components/PageTransition";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";

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

        {/* PROFILE */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <Profile />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <Dashboard />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* MARKETPLACE */}
        <Route
          path="/marketplace"
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <Marketplace />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* MAP VIEW */}
        <Route
          path="/map"
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <MapView />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* TRANSACTIONS */}
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <Transactions />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* MESSAGES */}
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <Messages />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
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