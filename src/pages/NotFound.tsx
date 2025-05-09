
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Logo from "@/components/svg/Logo";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-downscale-slate">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Logo className="mx-auto h-24 w-auto" />
          <h1 className="mt-4 text-3xl font-bold text-downscale-brown">
            Page Not Found
          </h1>
          <p className="mt-2 text-downscale-cream/80">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="flex justify-center">
          <Link to="/">
            <Button className="bg-downscale-blue hover:bg-downscale-blue/90">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
