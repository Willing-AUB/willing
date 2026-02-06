import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import HomePage from './pages/HomePage';
import AdminPage from './pages/admin/AdminPage';
import OrgReqPage from './pages/OrgReqPage';
import AdminHome from './pages/admin/AdminHome';
import AdminLogin from './pages/admin/AdminLogin';
import { BrowserRouter, Route, Routes } from 'react-router';

import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="admin" element={<AdminPage />}>
          <Route index element={<AdminHome />} />
          <Route path="login" element={<AdminLogin />} />
        </Route>
        <Route path="organizationrequest" element={<OrgReqPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
