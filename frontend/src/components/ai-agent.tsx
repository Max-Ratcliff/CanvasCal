import { Bot } from 'lucide-react';

export function AIAgent() {
  return (
    <div className="bg-white rounded-lg shadow-sm h-[calc(100vh-12rem)] flex flex-col" style={{ borderWidth: '2px', borderColor: '#185177' }}>
      <div className="p-4 flex items-center gap-3" style={{ borderBottom: '2px solid', borderColor: '#185177' }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#ffc971' }}>
          <Bot className="w-6 h-6" style={{ color: '#185177' }} />
        </div>
        <div>
          <h2 style={{ color: '#185177' }}>AI Calendar Assistant</h2>
          <p className="text-sm" style={{ color: '#c95603' }}>Your intelligent scheduling helper</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#ffc971' }}>
            <Bot className="w-12 h-12" style={{ color: '#185177' }} />
          </div>
          <h3 style={{ color: '#185177' }}>AI Assistant Placeholder</h3>
          <p className="text-sm mt-2" style={{ color: '#c95603' }}>
            This component is ready for your custom AI implementation. Connect your chatbot logic here to help students manage their schedules and assignments.
          </p>
        </div>
      </div>
    </div>
  );
}
