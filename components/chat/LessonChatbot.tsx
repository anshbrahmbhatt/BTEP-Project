"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, Sparkles, Users, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askLessonDoubt, getGlobalChatMessages, postGlobalChatMessage } from "@/app/dashboard/[slug]/[lessonId]/actions";

type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
};

export function LessonChatbot({ lessonId }: { lessonId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ai" | "global">("ai");

  // AI Chat State
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "bot", content: "Hi! I'm your AI Doubt Assistant. What questions do you have?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Global Chat State
  const [globalMessages, setGlobalMessages] = useState<any[]>([]);
  const [globalInput, setGlobalInput] = useState("");
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const globalContainerRef = useRef<HTMLDivElement>(null);
  
  // Dragging state
  const [position, setPosition] = useState({ x: -24, y: 96 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!isDragging) return;
    setPosition({
      x: dragRef.current.startPosX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.startPosY + (e.clientY - dragRef.current.startY)
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // Scroll to bottom for AI chat
  useEffect(() => {
    if (chatContainerRef.current && activeTab === "ai") {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isOpen, activeTab]);

  // Scroll to bottom for Global chat
  useEffect(() => {
    if (globalContainerRef.current && activeTab === "global") {
      globalContainerRef.current.scrollTop = globalContainerRef.current.scrollHeight;
    }
  }, [globalMessages, isOpen, activeTab]);

  // Global chat polling
  useEffect(() => {
    if (isOpen && activeTab === "global") {
      getGlobalChatMessages(lessonId).then((res) => {
        if (res.data) setGlobalMessages(res.data);
        if (res.sessionUserId) setSessionUserId(res.sessionUserId);
      });
      const interval = setInterval(() => {
        getGlobalChatMessages(lessonId).then((res) => {
          if (res.data) setGlobalMessages(res.data);
        });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, activeTab, lessonId]);

  const handleSendAI = async () => {
    if (!input.trim() || isLoading) return;

    const userQuery = input.trim();
    setInput("");
    
    const newHistory = [...messages, { id: Date.now().toString(), role: "user" as const, content: userQuery }];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const pastHistory = newHistory.slice(1, -1).map(m => ({ role: m.role, content: m.content }));
      const result = await askLessonDoubt(lessonId, userQuery, pastHistory);
      
      if (result?.error) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: "bot", content: "⚠️ " + result.error }]);
      } else if (result?.response) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: "bot", content: result.response }]);
      }
    } catch {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "bot", content: "⚠️ Sorry, I encountered an error." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendGlobal = async () => {
    if (!globalInput.trim() || isGlobalLoading) return;
    
    const text = globalInput.trim();
    setGlobalInput("");
    setIsGlobalLoading(true);
    
    try {
      const res = await postGlobalChatMessage(lessonId, text);
      if (res.success && res.data) {
        setGlobalMessages(prev => [...prev, res.data]);
      }
    } catch (err) {
      console.error("Failed to post global message");
    } finally {
      setIsGlobalLoading(false);
    }
  };

  const insertQuickPrompt = (prompt: string) => setInput(prompt);

  return (
    <>
      <div 
        className={`fixed z-[100] flex flex-col items-end ${isDragging ? 'pointer-events-none' : ''}`}
        style={{ 
          top: 0, 
          right: 0, 
          transform: `translate(${position.x}px, ${position.y}px)`,
          pointerEvents: isDragging ? 'none' : 'auto'
        }}
      >
        <div className="pointer-events-auto">
          {isOpen ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl w-80 md:w-96 h-[500px] max-h-[75vh] flex flex-col overflow-hidden animate-in slide-in-from-top-5 fade-in duration-300">
              
              {/* Header acts as drag handle */}
              <div 
                className="bg-blue-600 p-4 flex flex-col gap-3 shadow-sm cursor-grab active:cursor-grabbing touch-none select-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white pointer-events-none">
                    <MessageCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="font-semibold text-sm">Lesson Chats</span>
                  </div>
                  <button 
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} 
                    className="text-blue-100 hover:bg-blue-700 p-1 rounded-full transition-colors pointer-events-auto cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex bg-blue-700/50 rounded-lg p-1">
                  <button 
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => setActiveTab("ai")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeTab === "ai" ? "bg-white text-blue-600 shadow-sm" : "hover:bg-blue-500/50 text-blue-100"}`}
                  >
                    <Bot className="w-3.5 h-3.5" /> AI Doubt
                  </button>
                  <button 
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => setActiveTab("global")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeTab === "global" ? "bg-white text-blue-600 shadow-sm" : "hover:bg-blue-500/50 text-blue-100"}`}
                  >
                    <Users className="w-3.5 h-3.5" /> Global
                  </button>
                </div>
              </div>

              {/* AI CHAT */}
              {activeTab === "ai" && (
                <>
                  <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950 scroll-smooth">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${msg.role === "user" ? "bg-blue-600 text-white rounded-br-sm" : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-sm"}`}>
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm shadow-sm flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-75"></span>
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-150"></span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="px-3 pt-2 pb-1 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2 overflow-x-auto scrollbar-hide">
                    <button onClick={() => insertQuickPrompt("Explain like I'm 5:")} className="whitespace-nowrap text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full flex gap-1 items-center transition-colors">
                      <Sparkles className="w-3 h-3 text-blue-500" /> Explain like I'm 5
                    </button>
                    <button onClick={() => insertQuickPrompt("Can you give an example of")} className="whitespace-nowrap text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full transition-colors">
                      Give Example
                    </button>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900">
                    <form onSubmit={(e) => { e.preventDefault(); handleSendAI(); }} className="flex items-center gap-2 relative bg-slate-100 dark:bg-slate-800 rounded-full pr-1 overflow-hidden border border-slate-200 dark:border-slate-700 focus-within:ring-2 ring-blue-500 transition-shadow">
                      <Input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask AI..." 
                        className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-4 placeholder:text-slate-400"
                      />
                      <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="rounded-full w-8 h-8 shrink-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-400">
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </>
              )}

              {/* GLOBAL CHAT */}
              {activeTab === "global" && (
                <>
                  <div ref={globalContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950 scroll-smooth">
                    {globalMessages.map((msg) => {
                      const isMe = msg.userId === sessionUserId;
                      return (
                        <div key={msg.id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`flex flex-col max-w-[85%] ${isMe ? "items-end" : "items-start"}`}>
                            {!isMe && (
                              <span className="text-[10px] text-slate-400 font-medium ml-1 mb-1">
                                {msg.user?.name || "Student"}
                              </span>
                            )}
                            <div className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                              {!isMe && (
                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0 overflow-hidden">
                                  {msg.user?.image ? (
                                    <img src={msg.user.image} alt={msg.user.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <UserCircle className="w-full h-full text-slate-400" />
                                  )}
                                </div>
                              )}
                              <div className={`rounded-2xl px-3 py-2 text-sm shadow-sm ${isMe ? "bg-slate-800 text-white rounded-br-sm" : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-sm"}`}>
                                <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {globalMessages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 opacity-50">
                        <Users className="w-12 h-12" />
                        <p className="text-sm font-medium">No messages yet. Say hi!</p>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                    <form onSubmit={(e) => { e.preventDefault(); handleSendGlobal(); }} className="flex items-center gap-2 relative bg-slate-100 dark:bg-slate-800 rounded-full pr-1 overflow-hidden border border-slate-200 dark:border-slate-700 focus-within:ring-2 ring-slate-500 transition-shadow">
                      <Input 
                        value={globalInput}
                        onChange={(e) => setGlobalInput(e.target.value)}
                        placeholder="Message everyone..." 
                        className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-4 placeholder:text-slate-400"
                        maxLength={500}
                      />
                      <Button type="submit" size="icon" disabled={isGlobalLoading || !globalInput.trim()} className="rounded-full w-8 h-8 shrink-0 bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50">
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </>
              )}

            </div>
          ) : (
            <button 
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={(e) => {
                handlePointerUp(e);
                if (Math.abs(e.clientX - dragRef.current.startX) < 5 && Math.abs(e.clientY - dragRef.current.startY) < 5) {
                  setIsOpen(true);
                }
              }}
              className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-105 cursor-grab active:cursor-grabbing touch-none"
            >
              <MessageCircle className="w-6 h-6 pointer-events-none" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
