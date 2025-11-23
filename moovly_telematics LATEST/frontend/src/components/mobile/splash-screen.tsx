import { useEffect, useState } from "react";
import BirdIcon from "./bird-icon";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // After 2s fade out and show login (matches React Native timing)
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete();
      }, 600); // Allow fade out animation (matches React Native 600ms)
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) {
    return (
      <div className="fixed inset-0 bg-slate-800 flex flex-col items-center justify-center animate-out fade-out duration-600 z-50">
        <BirdIcon size={80} className="text-white mb-5" />
        <h1 className="text-2xl font-bold text-white tracking-wide">
          Plan. Load. Deliver.
        </h1>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-800 flex flex-col items-center justify-center animate-in fade-in duration-800 z-50">
      <BirdIcon size={80} className="text-white mb-5" />
      <h1 className="text-2xl font-bold text-white tracking-wide">
        Plan. Load. Deliver.
      </h1>
    </div>
  );
}