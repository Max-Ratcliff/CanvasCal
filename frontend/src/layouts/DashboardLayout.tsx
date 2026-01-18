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
    <div className="flex flex-col h-full bg-sidebar-background text-sidebar-foreground border-r border-border">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
          CanvasCal
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Link to={item.path} key={item.path}>
            <Button
              variant={location.pathname === item.path ? "secondary" : "ghost"}
              className="w-full justify-start gap-3 text-md"
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Button>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
         <div className="flex items-center gap-3 px-2">
            <div className="h-2 w-2 rounded-full bg-green-500" title="Canvas Synced"></div>
            <span className="text-sm text-muted-foreground">Synced</span>
         </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-background">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <span className="font-bold">CanvasCal</span>
          <Button variant="ghost" size="icon" onClick={() => setIsAgentOpen(!isAgentOpen)}>
             <Sparkles className="h-5 w-5 text-indigo-400" />
          </Button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 scroll-smooth">
          <Outlet />
        </main>
      </div>

      {/* Agent Sidebar (Collapsible) */}
      <AgentSidebar isOpen={isAgentOpen} toggle={() => setIsAgentOpen(!isAgentOpen)} />
    </div>
  );
}
