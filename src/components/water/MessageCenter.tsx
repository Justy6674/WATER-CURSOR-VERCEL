
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Trophy, Info, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrationMessages } from "@/hooks/useHydrationMessages";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Message {
  id: string;
  text: string;
  type: 'info' | 'achievement' | 'reminder';
  read: boolean;
  timestamp: string;
}

export function MessageCenter({ userId }: { userId?: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const actualUserId = userId || user?.id;
  
  useEffect(() => {
    if (!actualUserId) return;
    
    const savedMessages = localStorage.getItem(`messages-${actualUserId}`);
    if (savedMessages) {
      const parsedMessages = JSON.parse(savedMessages);
      setMessages(parsedMessages);
      
      const unread = parsedMessages.filter((msg: Message) => !msg.read).length;
      setUnreadCount(unread);
    }
  }, [actualUserId]);
  
  useEffect(() => {
    if (!actualUserId || messages.length === 0) return;
    localStorage.setItem(`messages-${actualUserId}`, JSON.stringify(messages));
    setUnreadCount(messages.filter(msg => !msg.read).length);
  }, [messages, actualUserId]);
  
  useEffect(() => {
    const handleNewMessage = (event: CustomEvent<Message>) => {
      const newMessage = event.detail;
      setMessages(prev => [newMessage, ...prev.slice(0, 49)]);
    };
    
    window.addEventListener('hydration-message' as any, handleNewMessage as EventListener);
    
    return () => {
      window.removeEventListener('hydration-message' as any, handleNewMessage as EventListener);
    };
  }, []);
  
  const markAsRead = (id: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, read: true } : msg
    ));
  };
  
  const markAllAsRead = () => {
    setMessages(prev => prev.map(msg => ({ ...msg, read: true })));
  };
  
  const deleteMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };
  
  const clearAllMessages = () => {
    setMessages([]);
  };
  
  const getMessageIcon = (type: string) => {
    switch(type) {
      case "achievement": return <Trophy className="h-5 w-5 text-yellow-300" />;
      case "tip": return <Info className="h-5 w-5 text-blue-400" />;
      case "alert": return <AlertCircle className="h-5 w-5 text-red-400" />;
      default: return <MessageSquare className="h-5 w-5 text-downscale-cream" />;
    }
  };
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    
    return `${diffDays}d ago`;
  };
  
  if (!actualUserId) return null;
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 bg-downscale-blue hover:bg-downscale-blue/90 text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MessageSquare className="h-5 w-5 mr-2" />
        Messages
        {unreadCount > 0 && (
          <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
        )}
      </Button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-16 right-4 z-50 w-80 max-h-96 overflow-hidden rounded-lg shadow-lg"
          >
            <Card className="bg-downscale-slate border-downscale-brown/20">
              <div className="p-3 flex items-center justify-between bg-downscale-blue/30">
                <h3 className="text-sm font-medium text-downscale-cream flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Hydration Messages
                </h3>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={markAllAsRead} 
                      className="h-7 px-2 text-xs text-downscale-cream/80"
                    >
                      Read all
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsOpen(false)} 
                    className="h-7 w-7 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="overflow-y-auto max-h-80 p-2 space-y-2">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-downscale-cream/60 text-sm">
                    No messages yet
                  </div>
                ) : (
                  <>
                    {messages.map(message => (
                      <div 
                        key={message.id} 
                        className={`p-2 rounded-md ${message.read ? 'bg-downscale-blue/10' : 'bg-downscale-blue/30'}`}
                        onClick={() => markAsRead(message.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2">
                            <div className="mt-0.5">
                              {getMessageIcon(message.type)}
                            </div>
                            <div>
                              <p className="text-sm text-downscale-cream">
                                {message.text}
                              </p>
                              <p className="text-xs text-downscale-cream/60 mt-1">
                                {formatTimestamp(message.timestamp)}
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMessage(message.id);
                            }} 
                            className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <Separator className="my-2 bg-downscale-brown/20" />
                    
                    <div className="flex justify-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearAllMessages} 
                        className="text-xs text-downscale-cream/70"
                      >
                        Clear all messages
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
