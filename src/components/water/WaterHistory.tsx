import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export interface WaterLogEntry {
  date: string;
  amount: number;
  goal: number;
  completed: boolean;
}

interface WaterHistoryProps {
  history: WaterLogEntry[];
}

export function WaterHistory({ history }: WaterHistoryProps) {
  // Sort history by date (most recent first)
  const sortedHistory = [...history].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Format date to display in a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  return (
    <Card className="bg-white/5 border-downscale-brown/20">
      <CardHeader>
        <CardTitle className="text-downscale-brown text-xl">Water History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedHistory.length === 0 ? (
            <p className="text-center text-downscale-cream/70 py-4">No history available yet. Start logging your water intake!</p>
          ) : (
            sortedHistory.map((entry, index) => {
              const percentage = Math.min(100, (entry.amount / entry.goal) * 100);
              
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-downscale-cream">
                      {formatDate(entry.date)}
                    </p>
                    <p className="text-sm text-downscale-cream/70">
                      {entry.amount >= 1000 ? 
                        `${(entry.amount/1000).toFixed(1)}L` : 
                        `${entry.amount}ml`} / 
                      {entry.goal >= 1000 ? 
                        `${(entry.goal/1000).toFixed(1)}L` : 
                        `${entry.goal}ml`}
                    </p>
                  </div>
                  <Progress 
                    value={percentage} 
                    className={`h-2 ${entry.completed ? "bg-green-500" : "bg-downscale-blue"}`}
                  />
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
