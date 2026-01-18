import { useState } from "react";
import { Sparkles, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

interface AgentSidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

export function AgentSidebar({ isOpen, toggle }: AgentSidebarProps) {
  const [messages, setMessages] = useState([
    { role: "agent", text: "Hi! I noticed you have a gap in your schedule tomorrow morning. Want to study for CSE 101?" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: "user", text: input }]);
    setInput("");
    
    // Fake response for now
    setTimeout(() => {
        setMessages(prev => [...prev, { role: "agent", text: "I'm checking your calendar..." }]);
    }, 600);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full border-l border-border bg-sidebar-background flex flex-col shadow-xl z-20"
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <span className="font-semibold">Academic Agent</span>
            </div>
            <Button variant="ghost" size="icon" onClick={toggle} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-lg text-sm ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "bg-muted text-foreground rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-background">
             <div className="flex gap-2">
                <Input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything..."
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    className="flex-1"
                />
                <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
                    <Send className="h-4 w-4" />
                </Button>
             </div>
             <p className="text-xs text-muted-foreground mt-2 text-center">
                I can manage your calendar & tasks.
             </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
