import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../features/shared/components/Navbar.jsx';

export function AppLayout() {
  const location = useLocation();
  // Hide standard navbar in active video meeting rooms and dedicated auth pages (login/register)
  const isMeetingRoom = /^\/room\/[^/]+$/.test(location.pathname);
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const showNavbar = !isMeetingRoom && !isAuthPage;

  return (
    <div style={{ minHeight: '100vh', height: isAuthPage ? '100vh' : 'auto', overflow: isAuthPage ? 'hidden' : 'visible', display: 'flex', flexDirection: 'column' }}>
      {showNavbar && <Navbar />}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: isAuthPage ? 'hidden' : 'visible' }}>
        <Outlet />
      </main>
    </div>
  );
}
