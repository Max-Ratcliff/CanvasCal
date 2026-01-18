import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import DashboardLayout from "@/layouts/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import CalendarPage from "@/pages/CalendarPage";
import SyllabusManager from "@/pages/SyllabusManager";

// Placeholder for missing Settings page
const Settings = () => <div className="p-4 text-xl">Settings Page</div>;

function App() {
  return (
    <Router>
      <Routes>
        {/* Main Dashboard Layout Wraps All Pages */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="syllabus" element={<SyllabusManager />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
