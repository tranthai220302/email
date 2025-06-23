import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SiteList from './pages/SiteList';
import SiteDetail from './pages/SiteDetail';

function App() {
  return (
    <Routes>
      <Route path="/" element={<SiteList />} />
      <Route path="/site/:siteId" element={<SiteDetail />} />
    </Routes>
  );
}

export default App;
