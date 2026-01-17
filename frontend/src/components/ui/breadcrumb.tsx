import * as React from "react";
import { Slot } from "@radix-ui/react-slot@1.1.2";
import { ChevronRight, MoreHorizontal } from "lucide-react@0.487.0";
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download, CheckCircle2, Circle, Calendar } from 'lucide-react';

import { cn } from "./utils";

function Breadcrumb({ ...props }: React.ComponentProps<"nav">) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5",
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  );
}

function BreadcrumbLink({
  asChild,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn("hover:text-foreground transition-colors", className)}
      {...props}
    />
  );
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("text-foreground font-normal", className)}
      {...props}
    />
  );
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  );
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  );
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'class' | 'exam' | 'assignment' | 'event';
  description?: string;
}

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch events from backend
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual backend endpoint
      const response = await fetch('http://localhost:8000/calendar/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.data.map((e: any) => ({
          ...e,
          date: new Date(e.start_time)
        })));
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getEventsForDay = (day: number) => {
    return events.filter(event => {
      const eventDate = event.date;
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const exportToGoogleCalendar = (event: CalendarEvent) => {
    const startDate = event.date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endDate = new Date(event.date.getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(event.description || '')}&sf=true&output=xml`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  const exportAllEvents = async () => {
    try {
      const response = await fetch('http://localhost:8000/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events })
      });
      
      if (response.ok) {
        alert('Events synced to Google Calendar!');
      }
    } catch (error) {
      console.error('Failed to sync events:', error);
      alert('Failed to sync events');
    }
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const typeColors = {
    class: 'text-white border',
    exam: 'text-white border',
    assignment: 'text-white border',
    event: 'text-white border',
  };
  
  const typeBackgrounds = {
    class: '#185177',
    exam: '#c95603',
    assignment: '#e2711d',
    event: '#ffb627',
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6" style={{ borderWidth: '2px', borderColor: '#185177' }}>
        <div className="flex items-center justify-center h-64">
          <p style={{ color: '#185177' }}>Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6" style={{ borderWidth: '2px', borderColor: '#185177' }}>
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ color: '#185177' }}>{monthName}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={exportAllEvents}
            className="flex items-center gap-2 px-3 py-2 text-sm text-white rounded-lg transition-colors"
            style={{ backgroundColor: '#185177' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2711d'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#185177'}
          >
            <Download className="w-4 h-4" />
            Export All
          </button>
          <button onClick={previousMonth} className="p-2 rounded-lg transition-colors" style={{ color: '#185177' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ffc971'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={nextMonth} className="p-2 rounded-lg transition-colors" style={{ color: '#185177' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ffc971'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm py-2" style={{ color: '#c95603' }}>
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: startingDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const dayEvents = getEventsForDay(day);
          const isToday = day === new Date().getDate() && 
                         currentDate.getMonth() === new Date().getMonth() &&
                         currentDate.getFullYear() === new Date().getFullYear();

          return (
            <div
              key={day}
              className="aspect-square rounded-lg p-2 transition-colors cursor-pointer"
              style={{
                borderWidth: '1px',
                borderColor: isToday ? '#185177' : '#e5e7eb',
                backgroundColor: isToday ? '#ffc971' : 'white',
              }}
            >
              <div className="text-sm mb-1" style={{ color: '#185177' }}>{day}</div>
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    className="text-xs px-1 py-0.5 rounded truncate cursor-pointer"
                    style={{ 
                      backgroundColor: typeBackgrounds[event.type],
                      color: 'white'
                    }}
                    onClick={() => setSelectedEvent(event)}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs" style={{ color: '#c95603' }}>
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2" style={{ color: '#185177' }}>{selectedEvent.title}</h3>
            <p className="text-sm mb-4" style={{ color: '#c95603' }}>
              {selectedEvent.date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            {selectedEvent.description && (
              <p className="text-sm mb-4" style={{ color: '#185177' }}>{selectedEvent.description}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => exportToGoogleCalendar(selectedEvent)}
                className="flex-1 px-4 py-2 text-sm text-white rounded-lg transition-colors"
                style={{ backgroundColor: '#185177' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2711d'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#185177'}
              >
                Export to Google Calendar
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 text-sm rounded-lg transition-colors"
                style={{ borderWidth: '1px', borderColor: '#185177', color: '#185177' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: Date;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export function AssignmentChecklist() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual backend endpoint
      const response = await fetch('http://localhost:8000/canvas/assignments');
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (id: string) => {
    setAssignments(prev =>
      prev.map(assignment =>
        assignment.id === id
          ? { ...assignment, completed: !assignment.completed }
          : assignment
      )
    );

    // TODO: Send update to backend
    try {
      await fetch(`http://localhost:8000/canvas/assignments/${id}/toggle`, {
        method: 'PATCH',
      });
    } catch (error) {
      console.error('Failed to update assignment:', error);
    }
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6" style={{ borderWidth: '2px', borderColor: '#185177' }}>
        <p style={{ color: '#185177' }}>Loading assignments...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6" style={{ borderWidth: '2px', borderColor: '#185177' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ color: '#185177' }}>Due Assignments</h2>
          <p className="text-sm mt-1" style={{ color: '#c95603' }}>
            {completedTasks} of {assignments.length} completed
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl" style={{ color: '#185177' }}>{incompleteTasks}</div>
          <div className="text-sm" style={{ color: '#c95603' }}>pending</div>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-8">
          <p style={{ color: '#c95603' }}>No assignments found. Sync with Canvas to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments
            .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
            .map(assignment => {
              const daysUntil = getDaysUntilDue(assignment.dueDate);
              const isOverdue = daysUntil === 'Overdue';

              return (
                <div
                  key={assignment.id}
                  className="flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer"
                  style={{
                    borderWidth: '1px',
                    borderColor: assignment.completed ? '#e5e7eb' : '#185177',
                    backgroundColor: assignment.completed ? '#f9fafb' : 'white',
                  }}
                  onClick={() => toggleComplete(assignment.id)}
                >
                  {assignment.completed ? (
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#185177' }} />
                  ) : (
                    <Circle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#185177' }} />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-sm font-medium mb-1"
                      style={{
                        color: assignment.completed ? '#9ca3af' : '#185177',
                        textDecoration: assignment.completed ? 'line-through' : 'none',
                      }}
                    >
                      {assignment.title}
                    </h3>
                    <p className="text-xs mb-2" style={{ color: '#c95603' }}>
                      {assignment.course}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                        style={{
                          backgroundColor: isOverdue ? '#fee2e2' : '#fef3c7',
                          color: isOverdue ? '#991b1b' : '#92400e',
                        }}
                      >
                        <Calendar className="w-3 h-3" />
                        {daysUntil}
                      </div>
                      <div
                        className="text-xs px-2 py-1 rounded text-white"
                        style={{ backgroundColor: priorityColors[assignment.priority] }}
                      >
                        {assignment.priority}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
