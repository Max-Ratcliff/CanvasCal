import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Calendar, RefreshCw, Download } from 'lucide-react';
import { api, CanvasAssignment } from '../services/api';
import { toast } from 'sonner';

interface Assignment {
  id: string;
  title: string;
  course: string;
  courseId?: string;
  dueDate: Date;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export function AssignmentChecklist() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);

  const fetchAssignments = async () => {
    // ... (same as before)
    const token = localStorage.getItem('canvas_token') || import.meta.env.VITE_CANVAS_TOKEN;
    
    setLoading(true);
    try {
      const response = await api.getCanvasAssignments(token || undefined);
      if (response.success && response.data) {
        const mapped: Assignment[] = response.data.map((a: any) => ({
          id: String(a.id),
          title: a.title,
          course: a.course_name,
          courseId: String(a.course_id),
          dueDate: a.due_at ? new Date(a.due_at) : new Date(),
          completed: false,
          priority: 'medium'
        }));
        setAssignments(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportSyllabus = async (courseId: string, courseName: string) => {
    const token = localStorage.getItem('canvas_token') || import.meta.env.VITE_CANVAS_TOKEN;
    setImporting(courseId);
    try {
      toast.info(`Searching for syllabus in ${courseName}...`);
      const response = await api.importCanvasSyllabus(Number(courseId), token || undefined);
      if (response.success) {
        toast.success(`Successfully imported ${response.data.length} events from ${courseName} syllabus!`);
        // We could refresh calendar here
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to import syllabus for ${courseName}`);
    } finally {
      setImporting(null);
    }
  };

  useEffect(() => {
    // Auto-fetch on mount
    fetchAssignments();
  }, []);

  const toggleComplete = (id: string) => {
    setAssignments(prev =>
      prev.map(assignment =>
        assignment.id === id
          ? { ...assignment, completed: !assignment.completed }
          : assignment
      )
    );
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `${diffDays} days left`;
  };

  const priorityColors = {
    high: '#c95603',
    medium: '#e2711d',
    low: '#ffb627',
  };

  const incompleteTasks = assignments.filter(a => !a.completed).length;
  const completedTasks = assignments.filter(a => a.completed).length;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6" style={{ borderWidth: '2px', borderColor: '#185177' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 style={{ color: '#185177' }}>Due Assignments</h2>
            <button 
              onClick={fetchAssignments} 
              disabled={loading}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Sync with Canvas"
            >
              <RefreshCw className={`w-4 h-4 text-[#185177] ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-sm mt-1" style={{ color: '#c95603' }}>
            {completedTasks} of {assignments.length} completed
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl" style={{ color: '#185177' }}>{incompleteTasks}</div>
          <div className="text-sm" style={{ color: '#c95603' }}>pending</div>
        </div>
      </div>

      <div className="space-y-3">
        {assignments
          .sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            return a.dueDate.getTime() - b.dueDate.getTime();
          })
          .map(assignment => (
            <div
              key={assignment.id}
              className="p-4 rounded-lg border transition-all"
              style={{
                backgroundColor: assignment.completed ? '#f5f5f5' : 'white',
                borderColor: assignment.completed ? '#ddd' : '#185177',
                opacity: assignment.completed ? 0.6 : 1
              }}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleComplete(assignment.id)}
                  className="mt-0.5 flex-shrink-0 transition-colors"
                  style={{ color: assignment.completed ? '#ffb627' : '#ccc' }}
                  onMouseEnter={(e) => !assignment.completed && (e.currentTarget.style.color = '#185177')}
                  onMouseLeave={(e) => !assignment.completed && (e.currentTarget.style.color = '#ccc')}
                >
                  {assignment.completed ? (
                    <CheckCircle2 className="w-5 h-5" style={{ color: '#ffb627' }} />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3
                      style={{
                        color: assignment.completed ? '#999' : '#185177',
                        textDecoration: assignment.completed ? 'line-through' : 'none'
                      }}
                    >
                      {assignment.title}
                    </h3>
                    <span
                      className="text-xs px-2 py-1 rounded-full border flex-shrink-0 text-white"
                      style={{ 
                        backgroundColor: priorityColors[assignment.priority],
                        borderColor: priorityColors[assignment.priority]
                      }}
                    >
                      {assignment.priority}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm" style={{ color: '#c95603' }}>{assignment.course}</p>
                    {assignment.courseId && (
                      <button
                        onClick={() => handleImportSyllabus(assignment.courseId!, assignment.course)}
                        disabled={!!importing}
                        className="flex items-center gap-1 text-xs font-medium hover:underline disabled:opacity-50"
                        style={{ color: '#185177' }}
                      >
                        <Download className={`w-3 h-3 ${importing === assignment.courseId ? 'animate-bounce' : ''}`} />
                        {importing === assignment.courseId ? 'Importing...' : 'Import Syllabus'}
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm mt-2" style={{ color: '#666' }}>
                    <Calendar className="w-4 h-4" style={{ color: '#185177' }} />
                    <span>
                      {assignment.dueDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span style={{ color: '#ccc' }}>•</span>
                    <span style={{ 
                      color: assignment.completed ? '#666' : 
                        (getDaysUntilDue(assignment.dueDate).includes('Overdue') || 
                         getDaysUntilDue(assignment.dueDate).includes('today')) ? '#c95603' : '#666'
                    }}>
                      {getDaysUntilDue(assignment.dueDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
