import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Calendar, 
  BookOpen, 
  Settings, 
  Menu, 
  Sparkles 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AgentSidebar } from "@/components/agent/AgentSidebar";

export default function DashboardLayout() {
  const location = useLocation();
  const [isAgentOpen, setIsAgentOpen] = useState(true);

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Calendar", icon: Calendar, path: "/calendar" },
    { name: "Syllabus Manager", icon: BookOpen, path: "/syllabus" },
    { name: "Settings", icon: Settings, path: "/settings" },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full text-white border-r border-none" style={{ backgroundColor: '#185177' }}>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white flex gap-2 items-center">
          <BookOpen className="h-6 w-6" style={{ color: '#ffc971' }} />
          CanvasCal
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link to={item.path} key={item.path}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-md transition-colors ${
                  isActive 
                    ? "font-bold shadow-md" 
                    : "hover:bg-white/10"
                }`}
                style={{ 
                  backgroundColor: isActive ? '#e2711d' : 'transparent',
                  color: 'white'
                }}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/20">
         <div className="flex items-center gap-3 px-2">
            <div className="h-2 w-2 rounded-full bg-green-400" title="Canvas Synced"></div>
            <span className="text-sm text-white/80">Synced</span>
         </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#ffc971' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 flex-shrink-0 shadow-xl z-10">
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4" style={{ backgroundColor: '#185177', color: 'white' }}>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-none">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <span className="font-bold">CanvasCal</span>
          <Button variant="ghost" size="icon" onClick={() => setIsAgentOpen(!isAgentOpen)} className="text-white hover:bg-white/10">
             <Sparkles className="h-5 w-5" style={{ color: '#ffc971' }} />
          </Button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Agent Sidebar (Collapsible) */}
      <AgentSidebar isOpen={isAgentOpen} toggle={() => setIsAgentOpen(!isAgentOpen)} />
    </div>
  );
}
