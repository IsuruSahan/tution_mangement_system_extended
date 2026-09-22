import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import our main navigation component
import NavigationBar from './components/NavigationBar';

// Import our new page components
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import PaymentsPage from './pages/PaymentsPage';
import AttendancePage from './pages/AttendancePage';
import FinanceReportPage from './pages/FinanceReportPage';
import SettingsPage from './pages/SettingsPage';
import ScanCheckInPage from './pages/ScanCheckInPage';

function App() {
  return (
    // BrowserRouter wraps your entire app to enable routing
    <BrowserRouter>
      <div className="App">
        {/* The NavigationBar will show on every page */}
        <NavigationBar />
        
        {/* 'Routes' defines all the possible pages.
         It will only render the one that matches the current URL.
        */}
        <Routes>
          {/* path="/" is the homepage */}
          <Route path="/" element={<DashboardPage />} />
          
          {/* path="/students" will show our new StudentsPage */}
          <Route path="/students" element={<StudentsPage />} />
          
          <Route path="/payments" element={<PaymentsPage />} />
          
          <Route path="/attendance" element={<AttendancePage />} />
          
          {/* --- THIS IS THE MISSING LINE --- */}
          <Route path="/finance-report" element={<FinanceReportPage />} />
          <Route path="/settings" element={<SettingsPage />} /> 
          <Route path="/scan" element={<ScanCheckInPage />} />
          
          {/* You can add a 404 "Not Found" page later */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;