
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export function WaterSettings() {
  const { waterGoal, setWaterGoal } = useAuth();
  const [goalInput, setGoalInput] = useState(waterGoal.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reminderStyle, setReminderStyle] = useState("kind");
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [gamificationEnabled, setGamificationEnabled] = useState(true);
  const [reminderMethod, setReminderMethod] = useState("push");
  
  // Default amounts for quick-add options
  const [defaults, setDefaults] = useState({
    waterBottle: "600",
    tea: "250",
    herbalTea: "200",
    broth: "300",
    electrolyte: "500",
    watermelon: "150",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newGoal = parseInt(goalInput);
    
    if (isNaN(newGoal) || newGoal <= 0) {
      toast.error("Please enter a valid water goal");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await setWaterGoal(newGoal);
      
      // Save settings to localStorage
      localStorage.setItem("hydration-defaults", JSON.stringify(defaults));
      localStorage.setItem("hydration-settings", JSON.stringify({
        reminderStyle,
        remindersEnabled,
        soundsEnabled,
        gamificationEnabled,
        reminderMethod
      }));
      
      toast.success("Settings updated successfully");
    } catch (error) {
      toast.error("Failed to update settings");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleReminders = (checked: boolean) => {
    setRemindersEnabled(checked);
    if (checked) {
      toast.success("Reminders enabled!");
    } else {
      toast.info("Reminders disabled");
    }
  };
  
  const handleToggleSounds = (checked: boolean) => {
    setSoundsEnabled(checked);
    toast.info(`Sounds ${checked ? 'enabled' : 'disabled'}`);
  };
  
  const handleToggleGamification = (checked: boolean) => {
    setGamificationEnabled(checked);
    toast.info(`Gamification ${checked ? 'enabled' : 'disabled'}`);
  };
  
  const handleDefaultChange = (key: keyof typeof defaults, value: string) => {
    setDefaults(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Show example reminder message based on selected style
  const getReminderExample = () => {
    switch (reminderStyle) {
      case "funny":
        return "You're 90% coffee. Add water, you maniac ☕➡💧";
      case "subtle":
        return "A gentle reminder to hydrate. 💧";
      case "kind":
        return "Hydrate your cells. You're doing great! 💧";
      case "forceful":
        return "Drink 3000ml or you're getting a kidney lecture. Now. 🚨";
      default:
        return "Don't forget to hydrate! 💧";
    }
  };

  return (
    <Card className="bg-white/5 border-downscale-brown/20">
      <CardHeader>
        <CardTitle className="text-downscale-cream text-xl">Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="waterGoal" className="text-sm font-medium text-downscale-cream">
              Daily Water Goal (ml)
            </Label>
            <Input
              id="waterGoal"
              type="number"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              min="500"
              max="10000"
              step="100"
              className="bg-opacity-20 bg-white text-downscale-cream border-downscale-brown/30"
            />
          </div>
          
          <Separator className="bg-downscale-brown/20" />
          
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-downscale-cream">Default Amounts</h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="waterBottle" className="text-xs text-downscale-cream/70">
                    Water Bottle (ml)
                  </Label>
                  <Input
                    id="waterBottle"
                    type="number"
                    value={defaults.waterBottle}
                    onChange={(e) => handleDefaultChange('waterBottle', e.target.value)}
                    className="bg-opacity-20 bg-white text-downscale-cream border-downscale-brown/30 mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="tea" className="text-xs text-downscale-cream/70">
                    Tea (ml)
                  </Label>
                  <Input
                    id="tea"
                    type="number"
                    value={defaults.tea}
                    onChange={(e) => handleDefaultChange('tea', e.target.value)}
                    className="bg-opacity-20 bg-white text-downscale-cream border-downscale-brown/30 mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="herbalTea" className="text-xs text-downscale-cream/70">
                    Herbal Tea (ml)
                  </Label>
                  <Input
                    id="herbalTea"
                    type="number"
                    value={defaults.herbalTea}
                    onChange={(e) => handleDefaultChange('herbalTea', e.target.value)}
                    className="bg-opacity-20 bg-white text-downscale-cream border-downscale-brown/30 mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="broth" className="text-xs text-downscale-cream/70">
                    Broth/Soup (ml)
                  </Label>
                  <Input
                    id="broth"
                    type="number"
                    value={defaults.broth}
                    onChange={(e) => handleDefaultChange('broth', e.target.value)}
                    className="bg-opacity-20 bg-white text-downscale-cream border-downscale-brown/30 mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="electrolyte" className="text-xs text-downscale-cream/70">
                    Electrolyte Drink (ml)
                  </Label>
                  <Input
                    id="electrolyte"
                    type="number"
                    value={defaults.electrolyte}
                    onChange={(e) => handleDefaultChange('electrolyte', e.target.value)}
                    className="bg-opacity-20 bg-white text-downscale-cream border-downscale-brown/30 mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="watermelon" className="text-xs text-downscale-cream/70">
                    Water-rich Foods (ml)
                  </Label>
                  <Input
                    id="watermelon"
                    type="number"
                    value={defaults.watermelon}
                    onChange={(e) => handleDefaultChange('watermelon', e.target.value)}
                    className="bg-opacity-20 bg-white text-downscale-cream border-downscale-brown/30 mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <Separator className="bg-downscale-brown/20" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-downscale-brown/20">
              <Label htmlFor="enable-gamification" className="text-sm font-medium text-downscale-cream">
                Enable Gamification
              </Label>
              <Switch 
                id="enable-gamification" 
                checked={gamificationEnabled}
                onCheckedChange={handleToggleGamification}
              />
            </div>
            
            <div className="flex items-center justify-between pb-2 border-b border-downscale-brown/20">
              <Label htmlFor="enable-sounds" className="text-sm font-medium text-downscale-cream">
                Enable Sounds
              </Label>
              <Switch 
                id="enable-sounds" 
                checked={soundsEnabled}
                onCheckedChange={handleToggleSounds}
              />
            </div>
            
            <div className="flex items-center justify-between pb-2 border-b border-downscale-brown/20">
              <Label htmlFor="enable-reminders" className="text-sm font-medium text-downscale-cream">
                Enable Reminders
              </Label>
              <Switch 
                id="enable-reminders" 
                checked={remindersEnabled}
                onCheckedChange={handleToggleReminders}
              />
            </div>
            
            {remindersEnabled && (
              <div className="space-y-4 p-3 rounded-md bg-downscale-blue/10">
                <div className="space-y-2">
                  <Label htmlFor="reminder-style" className="text-sm font-medium text-downscale-cream">
                    Reminder Style
                  </Label>
                  <Select 
                    value={reminderStyle} 
                    onValueChange={setReminderStyle}
                  >
                    <SelectTrigger id="reminder-style" className="bg-opacity-20 bg-white text-downscale-cream border-downscale-brown/30">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="funny">Funny</SelectItem>
                      <SelectItem value="subtle">Subtle</SelectItem>
                      <SelectItem value="kind">Kind</SelectItem>
                      <SelectItem value="forceful">Forceful</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reminder-method" className="text-sm font-medium text-downscale-cream">
                    Reminder Method
                  </Label>
                  <Select 
                    value={reminderMethod} 
                    onValueChange={setReminderMethod}
                  >
                    <SelectTrigger id="reminder-method" className="bg-opacity-20 bg-white text-downscale-cream border-downscale-brown/30">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="push">Push Notification</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="mt-2 p-3 rounded-md bg-downscale-slate text-sm text-downscale-cream/80">
                  <p className="font-medium mb-1">Example reminder:</p>
                  <p>{getReminderExample()}</p>
                </div>
              </div>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-downscale-blue text-white hover:bg-downscale-blue/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
