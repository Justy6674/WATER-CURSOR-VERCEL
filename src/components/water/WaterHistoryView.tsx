
import { useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronDown, ChevronUp, Droplet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWaterTracker } from "@/hooks/useWaterTracker";
import { useAuth } from "@/contexts/AuthContext";

interface ReminderMessage {
  id: string;
  text: string;
  timestamp: Date;
  type: string;
}

export function WaterHistoryView() {
  const { user } = useAuth();
  const { history } = useWaterTracker(user?.id || "");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const userPreferences = useMemo(() => {
    try {
      return localStorage.getItem("hydration-settings") 
        ? JSON.parse(localStorage.getItem("hydration-settings") || "{}")
        : {};
    } catch (e) {
      console.error("Error parsing hydration settings:", e);
      return {};
    }
  }, []);
  
  const showGeminiDebug = userPreferences?.development?.showGeminiDebug || false;
  
  const selectedDateStr = selectedDate.toISOString().split("T")[0];
  const selectedDayData = useMemo(() => {
    return history?.filter(entry => 
      entry.date.split("T")[0] === selectedDateStr
    ) || [];
  }, [history, selectedDateStr]);

  const [reminderMessages] = useState<ReminderMessage[]>([]);
  
  const formatTime = useCallback((dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'h:mm a');
    } catch (e) {
      return "Unknown time";
    }
  }, []);
  
  // Toggle expanded state
  const toggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  // Handle date selection
  const handleDateSelect = useCallback((date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setIsCalendarOpen(false);
    }
  }, []);
  
  return (
    <Card className="bg-white/5 border-downscale-brown/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-downscale-cream text-xl">Water History</CardTitle>
        <div className="flex items-center space-x-2">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[260px] justify-start text-left font-normal",
                  "border-downscale-brown/20 text-white bg-downscale-slate/80 hover:bg-downscale-blue/10",
                  "focus:ring-2 focus:ring-downscale-blue focus:ring-opacity-50"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-white/70" />
                {format(selectedDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-downscale-slate border-downscale-brown/20">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
                className="text-white"
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleExpanded}
            className="text-white hover:bg-downscale-blue/10"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className={cn("space-y-4", isExpanded ? "" : "max-h-[300px] overflow-y-auto")}>
        {selectedDayData.length === 0 ? (
          <div className="text-center py-8">
            <Droplet className="h-12 w-12 text-downscale-blue/50 mx-auto mb-2" />
            <p className="text-downscale-cream/70">No water intake logged for this date.</p>
            <p className="text-sm text-downscale-cream/50 mt-1">Select a different date or add water intake.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Add notes or log water intake" 
              className="w-full p-2 rounded-md bg-downscale-slate/80 border border-downscale-brown/20 text-white placeholder-downscale-cream/50 focus:ring-2 focus:ring-downscale-blue focus:outline-none" 
            />
            
            <div className="bg-downscale-blue/10 p-4 rounded-md border border-downscale-brown/20">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-downscale-cream">Summary</h3>
                <span className="text-sm text-downscale-cream/70">
                  {format(selectedDate, "EEEE, MMM d")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-downscale-cream/70">Total Intake</p>
                  <p className="text-xl font-semibold text-downscale-cream">
                    {selectedDayData[0]?.amount >= 1000
                      ? `${(selectedDayData[0].amount / 1000).toFixed(1)}L`
                      : `${selectedDayData[0].amount}ml`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-downscale-cream/70">Goal Completion</p>
                  <p className="text-xl font-semibold text-downscale-cream">
                    {Math.min(100, Math.round((selectedDayData[0].amount / selectedDayData[0].goal) * 100))}%
                  </p>
                </div>
              </div>
            </div>
            
            {reminderMessages.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-downscale-cream/80">Reminders</h3>
                {reminderMessages.map(message => (
                  <div 
                    key={message.id} 
                    className="p-3 rounded-md bg-downscale-slate border border-downscale-brown/20"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs text-downscale-cream/60">
                        {format(new Date(message.timestamp), 'h:mm a')}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-downscale-blue/20 text-downscale-cream/80">
                        {message.type}
                      </span>
                    </div>
                    <p className="text-sm text-downscale-cream">{message.text}</p>
                    
                    {showGeminiDebug && message.type === "reminder" && (
                      <div className="mt-2 pt-2 border-t border-downscale-brown/20">
                        <p className="text-xs text-downscale-cream/50 mb-1">Debug Info:</p>
                        <div className="bg-slate-800 p-2 rounded text-xs text-green-400 font-mono overflow-x-auto">
                          <p>Prompt: Generate {message.type} reminder with tone:kind</p>
                          <p>Response: {message.text}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-downscale-cream/80">Intake Log</h3>
              <div className="space-y-2">
                <div className="p-3 rounded-md bg-downscale-blue/10 border border-downscale-brown/20 flex items-center justify-between">
                  <div className="flex items-center">
                    <Droplet className="h-4 w-4 text-downscale-blue mr-2" />
                    <div>
                      <p className="text-sm text-downscale-cream">Water Bottle</p>
                      <p className="text-xs text-downscale-cream/70">Morning</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-downscale-cream">600ml</p>
                    <p className="text-xs text-downscale-cream/70">{format(selectedDate, "h:mm a")}</p>
                  </div>
                </div>
                
                {selectedDayData[0]?.amount > 600 && (
                  <div className="p-3 rounded-md bg-downscale-blue/10 border border-downscale-brown/20 flex items-center justify-between">
                    <div className="flex items-center">
                      <Droplet className="h-4 w-4 text-downscale-blue mr-2" />
                      <div>
                        <p className="text-sm text-downscale-cream">Glass of Water</p>
                        <p className="text-xs text-downscale-cream/70">Afternoon</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-downscale-cream">250ml</p>
                      <p className="text-xs text-downscale-cream/70">
                        {format(new Date(selectedDate.getTime() + 4 * 60 * 60 * 1000), "h:mm a")}
                      </p>
                    </div>
                  </div>
                )}
                
                {selectedDayData[0]?.amount > 850 && (
                  <div className="p-3 rounded-md bg-downscale-blue/10 border border-downscale-brown/20 flex items-center justify-between">
                    <div className="flex items-center">
                      <Droplet className="h-4 w-4 text-downscale-blue mr-2" />
                      <div>
                        <p className="text-sm text-downscale-cream">Herbal Tea</p>
                        <p className="text-xs text-downscale-cream/70">Evening</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-downscale-cream">200ml</p>
                      <p className="text-xs text-downscale-cream/70">
                        {format(new Date(selectedDate.getTime() + 8 * 60 * 60 * 1000), "h:mm a")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
