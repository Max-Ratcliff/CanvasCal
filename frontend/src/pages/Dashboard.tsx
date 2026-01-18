export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Good Morning, Max</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder Widgets */}
        <div className="h-64 rounded-xl bg-card border shadow-sm p-6">
            <h3 className="font-semibold mb-4">Assignment Checklist</h3>
            <div className="text-muted-foreground text-sm">Loading assignments...</div>
        </div>
        <div className="h-64 rounded-xl bg-card border shadow-sm p-6">
            <h3 className="font-semibold mb-4">Today's Schedule</h3>
            <div className="text-muted-foreground text-sm">No classes today.</div>
        </div>
        <div className="h-64 rounded-xl bg-card border shadow-sm p-6">
             <h3 className="font-semibold mb-4">Announcements</h3>
             <div className="text-muted-foreground text-sm">Check syllabus for updates.</div>
        </div>
      </div>
    </div>
  );
}
