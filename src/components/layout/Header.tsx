import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { ProfileSettingsModal } from "@/components/user/ProfileSettingsModal";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { SettingsModal } from "@/components/water/SettingsModal";
import { Bell, User as UserIcon } from "lucide-react";
import Logo from "@/components/svg/Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  
  // Check if there's a display name in the user metadata
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  
  const handleLogout = () => {
    onLogout();
    setShowProfileSettings(false);
  };
  
  // Handle profile settings modal close
  const handleCloseProfileSettings = () => {
    setShowProfileSettings(false);
  };
  
  return (
    <header className="bg-downscale-slate/50 backdrop-blur-md sticky top-0 z-10 border-b border-downscale-brown/10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Logo className="h-8 w-auto mr-4" />
          <h1 className="text-xl font-semibold text-downscale-cream">Water-4-WeightLoss</h1>
        </div>
        
        {user && (
          <div className="flex items-center gap-2">
            <SettingsModal />
            
            <ThemeToggle className="hidden lg:flex" />
            
            {/* <Button variant="ghost" size="icon" className="text-downscale-cream hover:bg-downscale-blue/20">
              <Bell className="h-5 w-5" />
            </Button> */}

            {/* Avatar and Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full overflow-hidden border border-downscale-brown/30 hover:bg-downscale-blue/20"
                >
                  <div className="bg-downscale-blue rounded-full w-full h-full flex items-center justify-center text-white">
                    {displayName[0].toUpperCase()}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-56 bg-downscale-slate/95 backdrop-blur-md border border-downscale-brown/20">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium text-downscale-cream">{displayName}</p>
                    <p className="text-xs text-downscale-cream/70 truncate">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator className="bg-downscale-brown/20" />
                
                <DropdownMenuItem 
                  onClick={() => setShowProfileSettings(true)}
                  className="text-downscale-cream hover:bg-downscale-blue/20 cursor-pointer"
                >
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-downscale-brown/20" />
                
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 hover:bg-red-950/20 cursor-pointer"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      
      {/* Profile settings modal */}
      {user && (
        <ProfileSettingsModal
          user={user}
          isOpen={showProfileSettings}
          onClose={handleCloseProfileSettings}
          onLogout={handleLogout}
        />
      )}
    </header>
  );
}
