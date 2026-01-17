import { Calendar } from './components/calendar';
import { AIAgent } from './components/ai-agent';
import { AssignmentChecklist } from './components/assignment-checklist';

export default function App() {
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#ffc971' }}>
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 style={{ color: '#185177' }}>School Calendar Hub</h1>
          <p className="mt-1" style={{ color: '#c95603' }}>Manage your academic schedule and export events to Google Calendar</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Calendar and Checklists */}
          <div className="lg:col-span-2 space-y-6">
            <Calendar />
            <AssignmentChecklist />
          </div>
          
          {/* Right Column - AI Agent */}
          <div className="lg:col-span-1">
            <AIAgent />
          </div>
        </div>
      </div>
    </div>
  );
}