
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SettingsModal() {
  const { waterGoal, setWaterGoal } = useAuth();
  const [goalInput, setGoalInput] = useState(waterGoal.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [gamificationEnabled, setGamificationEnabled] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  
  // Default amounts for quick-add options
  const [defaults, setDefaults] = useState({
    waterBottle: "600",
    tea: "250",
    herbalTea: "200",
    broth: "300",
    electrolyte: "500",
    watermelon: "150",
  });

  useEffect(() => {
    // Load saved settings from localStorage when modal opens
    if (isOpen) {
      const savedDefaults = localStorage.getItem("hydration-defaults");
      const savedSettings = localStorage.getItem("hydration-settings");
      
      if (savedDefaults) {
        setDefaults(JSON.parse(savedDefaults));
      }
      
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setSoundsEnabled(settings.soundsEnabled || true);
        setGamificationEnabled(settings.gamificationEnabled || true);
      }
      
      // Ensure goal input is synced with current waterGoal
      setGoalInput(waterGoal.toString());
    }
  }, [isOpen, waterGoal]);

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
        soundsEnabled,
        gamificationEnabled,
        development: {
          showGeminiDebug: false // Default to false, but can be set in ProfileSettingsModal
        }
      }));
      
      toast.success("Settings updated successfully");
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to update settings");
      console.error(error);
    } finally {
      setIsSubmitting(false);
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

  // Handle proper dialog state management
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-downscale-cream hover:bg-downscale-blue/20">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-downscale-slate border-downscale-brown/20 text-downscale-cream max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-downscale-cream text-xl">Hydration Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="bg-downscale-blue/10 border border-downscale-brown/20">
            <TabsTrigger 
              value="general" 
              className="text-downscale-cream data-[state=active]:bg-downscale-blue/20"
            >
              General
            </TabsTrigger>
            <TabsTrigger 
              value="defaults" 
              className="text-downscale-cream data-[state=active]:bg-downscale-blue/20"
            >
              Defaults
            </TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <TabsContent value="general" className="space-y-4 pt-4">
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
                
                <div className="p-3 rounded-md bg-downscale-blue/10 text-sm">
                  <p className="text-downscale-cream/80">
                    <strong>Note:</strong> Reminder settings have been moved to Profile Settings.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="defaults" className="space-y-4 pt-4">
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
            </TabsContent>
            
            <div className="flex justify-end mt-6 space-x-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="text-downscale-cream hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-downscale-blue text-white hover:bg-downscale-blue/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
