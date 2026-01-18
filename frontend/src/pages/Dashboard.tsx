import { Calendar } from '@/components/calendar';
import { AssignmentChecklist } from '@/components/assignment-checklist';
import { Announcements } from '@/components/announcements';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#185177' }}>Good Morning, Max</h1>
          <p className="mt-1" style={{ color: '#c95603' }}>
            You have 3 deadlines today.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <Calendar />
          <Announcements />
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          <AssignmentChecklist />
        </div>
      </div>
    </div>
  );
}