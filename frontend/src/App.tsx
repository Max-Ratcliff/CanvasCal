import { useState } from 'react';
import { Calendar } from './components/calendar';
import { AIAgent } from './components/ai-agent';
import { AssignmentChecklist } from './components/assignment-checklist';
import { api } from './services/api';
import { Upload } from 'lucide-react';

export default function App() {
  const [uploading, setUploading] = useState(false);

  const handleSyllabusUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await api.uploadSyllabus(file);
      if (response.success) {
        alert('Syllabus processed successfully! Events added to calendar.');
        // Trigger calendar refresh
        window.location.reload();
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to process syllabus. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#ffc971' }}>
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{ color: '#185177' }}>School Calendar Hub</h1>
              <p className="mt-1" style={{ color: '#c95603' }}>
                Manage your academic schedule and export events to Google Calendar
              </p>
            </div>
            
            <label className="flex items-center gap-2 px-4 py-2 text-white rounded-lg cursor-pointer transition-colors"
              style={{ backgroundColor: '#185177' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2711d'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#185177'}>
              <Upload className="w-4 h-4" />
              {uploading ? 'Processing...' : 'Upload Syllabus'}
              <input
                type="file"
                accept=".pdf"
                onChange={handleSyllabusUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
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