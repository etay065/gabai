import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import GabaiLogin from './pages/GabaiLogin';
import GabaiRegister from './pages/GabaiRegister';
import GabaiDashboard from './pages/GabaiDashboard';
import MemberEntry from './pages/MemberEntry';
import MemberDashboard from './pages/MemberDashboard';
import AuctionPage from './pages/AuctionPage';
import MembersPage from './pages/MembersPage';
import AnnouncePage from './pages/AnnouncePage';
import SchedulePage from './pages/SchedulePage';
import { useAuth } from './context/AuthContext';

function ProtectedGabai({ children }) {
  const { gabai } = useAuth();
  return gabai ? children : <Navigate to="/gabai/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/gabai/login" element={<GabaiLogin />} />
      <Route path="/gabai/register" element={<GabaiRegister />} />
      <Route path="/gabai/*" element={<ProtectedGabai><GabaiDashboard /></ProtectedGabai>} />
      <Route path="/member" element={<MemberEntry />} />
      <Route path="/member/dashboard" element={<MemberDashboard />} />
      <Route path="/auctions" element={<AuctionPage />} />
      <Route path="/members" element={<MembersPage />} />
      <Route path="/announce" element={<AnnouncePage />} />
      <Route path="/schedule" element={<SchedulePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
