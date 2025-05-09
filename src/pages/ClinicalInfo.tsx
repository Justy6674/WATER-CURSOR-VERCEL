
import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HydrationBasics } from "@/components/clinical/HydrationBasics";
import { Benefits } from "@/components/clinical/Benefits";
import { ElectrolyteInfo } from "@/components/clinical/ElectrolyteInfo";
import { TipsSection } from "@/components/clinical/TipsSection";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/svg/Logo";

export default function ClinicalInfo() {
  return (
    <div className="min-h-screen bg-downscale-slate">
      <header className="bg-downscale-slate/50 backdrop-blur-md sticky top-0 z-10 border-b border-downscale-brown/10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Logo className="h-8 w-auto mr-4" />
            <h1 className="text-xl font-semibold text-downscale-cream">Water-4-WeightLoss</h1>
          </div>
          
          <Link to="/">
            <Button variant="ghost" className="text-downscale-cream hover:bg-downscale-blue/20">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-8">
            <Logo className="h-16 w-auto mr-4" />
            <h1 className="text-3xl font-bold text-downscale-cream">Clinical Information</h1>
          </div>
          
          <div className="space-y-12">
            <HydrationBasics />
            <Separator className="bg-downscale-brown/20" />
            
            <Benefits />
            <Separator className="bg-downscale-brown/20" />
            
            <ElectrolyteInfo />
            <Separator className="bg-downscale-brown/20" />
            
            <TipsSection />
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-sm text-downscale-cream/70 mb-4">
              This information is provided for educational purposes only and is not intended as medical advice.
              Always consult with your healthcare provider for personalized recommendations.
            </p>
            
            <Link to="/">
              <Button className="bg-downscale-blue hover:bg-downscale-blue/90">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
