
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useBiometrics } from "@/hooks/useBiometrics";
import { Fingerprint, User } from "lucide-react";
import { toast } from "sonner";

interface AuthFormProps {
  onSuccess: () => void;
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const { signIn, signUp } = useAuth();
  const { isAvailable, checkBiometricAvailability, authenticateWithBiometrics } = useBiometrics();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  useEffect(() => {
    const checkBiometrics = async () => {
      const available = await checkBiometricAvailability();
      setBiometricsEnabled(available);
    };
    checkBiometrics();
  }, [checkBiometricAvailability]);

  const handleBiometricAuth = async () => {
    setIsLoading(true);
    try {
      const success = await authenticateWithBiometrics();
      if (success) {
        const savedEmail = localStorage.getItem('lastUsedEmail');
        const savedPassword = localStorage.getItem('lastUsedPassword');
        
        if (savedEmail && savedPassword) {
          await signIn(savedEmail, savedPassword, true);
          onSuccess();
        } else {
          toast.error("Please sign in once with credentials first");
        }
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      toast.error("Biometric authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!isLogin && formData.password !== formData.confirmPassword) {
        setError("Passwords don't match");
        setIsLoading(false);
        return;
      }

      if (isLogin) {
        await signIn(formData.email, formData.password, staySignedIn);
        if (staySignedIn) {
          localStorage.setItem('lastUsedEmail', formData.email);
          localStorage.setItem('lastUsedPassword', formData.password);
        }
      } else {
        await signUp(formData.email, formData.password, formData.name);
      }
      onSuccess();
    } catch (error: any) {
      setError(error.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="w-full space-y-6 max-w-md mx-auto">
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-md text-white text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Your name"
              required={!isLogin}
              value={formData.name}
              onChange={handleChange}
              className="bg-downscale-slate text-downscale-cream border-downscale-brown/30 placeholder:text-downscale-cream/50"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            value={formData.email}
            onChange={handleChange}
            className="bg-downscale-slate text-downscale-cream border-downscale-brown/30 placeholder:text-downscale-cream/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="bg-downscale-slate text-downscale-cream border-downscale-brown/30 placeholder:text-downscale-cream/50"
          />
        </div>

        {!isLogin && (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required={!isLogin}
              value={formData.confirmPassword}
              onChange={handleChange}
              className="bg-downscale-slate text-downscale-cream border-downscale-brown/30 placeholder:text-downscale-cream/50"
            />
          </div>
        )}

        {isLogin && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="staySignedIn"
              checked={staySignedIn}
              onCheckedChange={(checked) => setStaySignedIn(checked as boolean)}
              className="bg-white/10 border-downscale-brown/30"
            />
            <Label htmlFor="staySignedIn" className="text-sm text-downscale-cream/80">
              Stay signed in
            </Label>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full bg-downscale-blue hover:bg-downscale-blue/90 text-white"
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
        </Button>

        {isLogin && biometricsEnabled && (
          <Button
            type="button"
            onClick={handleBiometricAuth}
            className="w-full bg-downscale-brown/50 hover:bg-downscale-brown/70 text-white flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            <Fingerprint className="h-5 w-5" />
            <User className="h-5 w-5" />
            <span>Sign in with biometrics</span>
          </Button>
        )}
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-downscale-cream/20"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-downscale-slate px-2 text-downscale-cream/70">OR</span>
        </div>
      </div>

      <div className="text-center text-sm">
        <Button 
          variant="link" 
          className="text-downscale-cream hover:text-downscale-blue"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </Button>
      </div>
    </div>
  );
}
