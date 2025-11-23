import React, { useState, useEffect } from 'react';
import { MessageCircle, Navigation, TrendingUp, MapPin, Clock, AlertTriangle, Fuel, CheckSquare, Wrench } from 'lucide-react';
// MoovScore logo as SVG to reduce bundle size
const MoovScoreLogo = () => (
  <svg width="140" height="40" viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="140" height="40" rx="8" fill="#10b981"/>
    <text x="70" y="25" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="white" textAnchor="middle">MoovScore</text>
  </svg>
);

const AnimatedLogisticsVideo = () => {
  const [currentScene, setCurrentScene] = useState(0);
  const [carPosition, setCarPosition] = useState(0);
  const [alertIndex, setAlertIndex] = useState(0);
  
  useEffect(() => {
    const sceneInterval = setInterval(() => {
      setCurrentScene((prev) => (prev + 1) % 4);
    }, 10000); // 10 seconds per scene for 40 second total loop
    
    const carInterval = setInterval(() => {
      setCarPosition((prev) => (prev + 1) % 4);
    }, 2500);
    
    const alertInterval = setInterval(() => {
      setAlertIndex((prev) => (prev + 1) % 3);
    }, 3000);
    
    return () => {
      clearInterval(sceneInterval);
      clearInterval(carInterval);
      clearInterval(alertInterval);
    };
  }, []);

  return (
    <div className="relative w-full h-[500px] bg-gradient-to-br from-blue-50 via-white to-slate-50 rounded-lg overflow-hidden shadow-sm border border-slate-200">
      <svg
        viewBox="0 0 1000 500"
        className="w-full h-full"
        style={{ filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.1))' }}
      >
        {/* Background Elements */}
        <defs>
          <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="50%" stopColor="#4b5563" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
          
          <linearGradient id="truckGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          
          <pattern id="cityGrid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f1f5f9" strokeWidth="1" opacity="0.4"/>
          </pattern>
          
          {/* Vehicle Definitions */}
          <g id="modernTruck">
            <rect x="0" y="8" width="35" height="14" fill="url(#truckGradient)" rx="3"/>
            <rect x="35" y="12" width="12" height="10" fill="#1e40af" rx="2"/>
            <circle cx="12" cy="26" r="4" fill="#374151"/>
            <circle cx="35" cy="26" r="4" fill="#374151"/>
            <circle cx="12" cy="26" r="2" fill="#e5e7eb"/>
            <circle cx="35" cy="26" r="2" fill="#e5e7eb"/>
            <rect x="5" y="12" width="8" height="6" fill="#60a5fa" opacity="0.7" rx="1"/>
            <rect x="38" y="16" width="6" height="4" fill="#60a5fa" opacity="0.7" rx="1"/>
          </g>
          
          <g id="modernVan">
            <rect x="0" y="10" width="28" height="12" fill="#059669" rx="3"/>
            <rect x="28" y="13" width="8" height="9" fill="#10b981" rx="2"/>
            <circle cx="8" cy="26" r="3.5" fill="#374151"/>
            <circle cx="28" cy="26" r="3.5" fill="#374151"/>
            <circle cx="8" cy="26" r="1.5" fill="#e5e7eb"/>
            <circle cx="28" cy="26" r="1.5" fill="#e5e7eb"/>
            <rect x="3" y="14" width="6" height="4" fill="#6ee7b7" opacity="0.7" rx="1"/>
          </g>
          
          <g id="depot">
            <rect x="0" y="15" width="60" height="35" fill="#6b7280" rx="4"/>
            <rect x="8" y="22" width="44" height="28" fill="#9ca3af" rx="2"/>
            <rect x="15" y="28" width="12" height="15" fill="#374151" rx="1"/>
            <rect x="33" y="28" width="12" height="15" fill="#374151" rx="1"/>
            <rect x="20" y="8" width="20" height="12" fill="#4b5563" rx="2"/>
            <polygon points="15,8 30,2 45,8" fill="#374151"/>
            <text x="30" y="40" textAnchor="middle" className="text-xs fill-white font-semibold">DEPOT</text>
          </g>
        </defs>
        
        <rect width="1000" height="500" fill="url(#cityGrid)"/>
        
        {/* Scene 1: Mini Delivery Van Route with Location Alerts */}
        {currentScene === 0 && (
          <g className="animate-fade-in">
            <text x="500" y="60" textAnchor="middle" className="text-3xl font-bold fill-slate-800">
              Real-time Customer Alerts & Route Tracking
            </text>
            <text x="500" y="90" textAnchor="middle" className="text-lg fill-slate-600">
              Automated notifications and in-app messaging during deliveries
            </text>
            
            {/* City Skyline Background */}
            <rect x="100" y="120" width="800" height="180" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" rx="12"/>
            
            {/* City Buildings Silhouette */}
            <rect x="150" y="140" width="30" height="80" fill="#e2e8f0" rx="2"/>
            <rect x="200" y="120" width="40" height="100" fill="#cbd5e1" rx="2"/>
            <rect x="260" y="160" width="25" height="60" fill="#e2e8f0" rx="2"/>
            <rect x="300" y="130" width="35" height="90" fill="#cbd5e1" rx="2"/>
            <rect x="400" y="145" width="45" height="75" fill="#e2e8f0" rx="2"/>
            <rect x="500" y="125" width="50" height="95" fill="#cbd5e1" rx="2"/>
            <rect x="600" y="155" width="30" height="65" fill="#e2e8f0" rx="2"/>
            <rect x="650" y="135" width="40" height="85" fill="#cbd5e1" rx="2"/>
            <rect x="720" y="150" width="35" height="70" fill="#e2e8f0" rx="2"/>
            <rect x="780" y="140" width="45" height="80" fill="#cbd5e1" rx="2"/>
            
            {/* Road - Straight Line */}
            <rect x="150" y="320" width="700" height="8" fill="#6b7280" rx="4"/>
            <rect x="150" y="324" width="700" height="2" fill="#9ca3af" rx="1"/>
            
            {/* Location Pin Icons */}
            <g>
              {/* Blue Pin - Location 1 */}
              <path d="M 320 290 C 320 280, 330 270, 340 270 C 350 270, 360 280, 360 290 C 360 300, 340 320, 340 320 C 340 320, 320 300, 320 290 Z" 
                    fill="#3b82f6" stroke="white" strokeWidth="2"/>
              <circle cx="340" cy="285" r="4" fill="white"/>
            </g>
            <g>
              {/* Red Pin - Location 2 */}
              <path d="M 520 290 C 520 280, 530 270, 540 270 C 550 270, 560 280, 560 290 C 560 300, 540 320, 540 320 C 540 320, 520 300, 520 290 Z" 
                    fill="#dc2626" stroke="white" strokeWidth="2"/>
              <circle cx="540" cy="285" r="4" fill="white"/>
            </g>
            <g>
              {/* Red Pin - Location 3 */}
              <path d="M 720 290 C 720 280, 730 270, 740 270 C 750 270, 760 280, 760 290 C 760 300, 740 320, 740 320 C 740 320, 720 300, 720 290 Z" 
                    fill="#dc2626" stroke="white" strokeWidth="2"/>
              <circle cx="740" cy="285" r="4" fill="white"/>
            </g>
            
            {/* Mini Delivery Van */}
            <g style={{transform: `translateX(${150 + carPosition * 200}px)`, transition: 'transform 2.5s ease-in-out'}}>
              {/* Van Body - Yellow with Red Cab like in image */}
              <rect x="0" y="305" width="45" height="20" fill="#fbbf24" stroke="#1f2937" strokeWidth="1" rx="3"/>
              <rect x="0" y="305" width="18" height="20" fill="#dc2626" stroke="#1f2937" strokeWidth="1" rx="3"/>
              
              {/* Van Windows */}
              <rect x="2" y="307" width="14" height="8" fill="#7dd3fc" rx="1"/>
              <rect x="20" y="307" width="8" height="6" fill="#334155" rx="1"/>
              
              {/* Wheels */}
              <circle cx="8" cy="330" r="4" fill="#1f2937" stroke="#4b5563" strokeWidth="1"/>
              <circle cx="37" cy="330" r="4" fill="#1f2937" stroke="#4b5563" strokeWidth="1"/>
              <circle cx="8" cy="330" r="2" fill="#6b7280"/>
              <circle cx="37" cy="330" r="2" fill="#6b7280"/>
            </g>
            
            {/* Alert Notifications with Icons */}
            {(alertIndex >= 0 && carPosition >= 1) && (
              <g>
                <rect x="200" y="350" width="240" height="35" fill="white" stroke="#3b82f6" strokeWidth="2" rx="8"/>
                <circle cx="215" cy="367" r="8" fill="#3b82f6"/>
                <text x="215" y="371" textAnchor="middle" className="text-xs fill-white font-bold">!</text>
                <text x="235" y="372" className="text-sm fill-slate-800 font-medium">Customer Alert: Arriving in 5 minutes</text>
              </g>
            )}
            
            {(alertIndex >= 1 && carPosition >= 2) && (
              <g>
                <rect x="380" y="350" width="240" height="35" fill="white" stroke="#10b981" strokeWidth="2" rx="8"/>
                <MessageCircle x="390" y="360" width="14" height="14" className="fill-green-500"/>
                <text x="415" y="372" className="text-sm fill-slate-800 font-medium">Message: Package delivered successfully</text>
              </g>
            )}
            
            {(alertIndex >= 2 && carPosition >= 3) && (
              <g>
                <rect x="580" y="350" width="240" height="35" fill="white" stroke="#f59e0b" strokeWidth="2" rx="8"/>
                <Clock x="590" y="360" width="14" height="14" className="fill-amber-500"/>
                <text x="615" y="372" className="text-sm fill-slate-800 font-medium">ETA Update: Next delivery in 8 minutes</text>
              </g>
            )}
          </g>
        )}
        
        {/* Scene 2: Route Deviation Monitoring */}
        {currentScene === 1 && (
          <g className="animate-fade-in">
            <text x="500" y="60" textAnchor="middle" className="text-3xl font-bold fill-slate-800">
              Planned vs Actual Route Monitoring
            </text>
            <text x="500" y="90" textAnchor="middle" className="text-lg fill-slate-600">
              Real-time deviation alerts and route optimization
            </text>
            
            {/* Map Background */}
            <rect x="100" y="120" width="800" height="300" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="3" rx="12"/>
            
            {/* Planned Route (Green) */}
            <path d="M 150 250 Q 300 180 450 220 Q 600 260 750 200 Q 850 160 900 180" 
                  fill="none" stroke="#10b981" strokeWidth="6" strokeDasharray="15,5" opacity="0.8"/>
            <text x="180" y="200" className="text-sm fill-green-600 font-semibold">Planned Route</text>
            
            {/* Actual Route (Blue with deviation) */}
            <path d="M 150 250 Q 280 200 430 280 Q 580 320 720 240 Q 820 200 900 180" 
                  fill="none" stroke="#3b82f6" strokeWidth="6" opacity="0.9"/>
            <text x="180" y="320" className="text-sm fill-blue-600 font-semibold">Actual Route</text>
            
            {/* Vehicle on actual route */}
            <use href="#modernTruck" x="540" y="290">
              <animateTransform attributeName="transform" type="translate"
                values="540,290; 600,310; 660,260; 720,230; 780,210"
                dur="8s" repeatCount="indefinite"/>
            </use>
            
            {/* Deviation Alert */}
            <g className="animate-pulse">
              <circle cx="480" cy="300" r="25" fill="#fef3c7" stroke="#f59e0b" strokeWidth="3"/>
              <AlertTriangle x="470" y="290" width="20" height="20" className="fill-amber-500"/>
            </g>
            
            {/* Deviation Stats */}
            <rect x="720" y="140" width="160" height="120" fill="white" stroke="#e2e8f0" strokeWidth="2" rx="8"/>
            <text x="800" y="165" textAnchor="middle" className="text-sm font-bold fill-slate-800">Route Deviation</text>
            <text x="800" y="185" textAnchor="middle" className="text-lg font-bold fill-red-500">+2.3 km</text>
            <text x="800" y="205" textAnchor="middle" className="text-sm fill-slate-600">Extra Distance</text>
            <text x="800" y="225" textAnchor="middle" className="text-lg font-bold fill-orange-500">+12 min</text>
            <text x="800" y="245" textAnchor="middle" className="text-sm fill-slate-600">Delay Time</text>
          </g>
        )}
        
        {/* Scene 3: Fuel Capture, Vehicle Checklist & Maintenance */}
        {currentScene === 2 && (
          <g className="animate-fade-in">
            <text x="500" y="60" textAnchor="middle" className="text-3xl font-bold fill-slate-800">
              Vehicle Management & Maintenance Tracking
            </text>
            <text x="500" y="90" textAnchor="middle" className="text-lg fill-slate-600">
              Fuel capture, checklists, and Trello-style maintenance boards
            </text>
            
            {/* Three Management Panels - British Theme */}
            
            {/* Fuel Capture Panel - Red */}
            <rect x="120" y="130" width="220" height="200" fill="white" stroke="#dc2626" strokeWidth="3" rx="12"/>
            <text x="230" y="155" textAnchor="middle" className="text-lg font-bold fill-slate-800">Fuel Capture</text>
            <Fuel x="200" y="170" width="60" height="60" className="stroke-red-600 fill-none" strokeWidth="2"/>
            <rect x="140" y="250" width="180" height="30" fill="#fef2f2" stroke="#dc2626" strokeWidth="1" rx="6"/>
            <text x="230" y="270" textAnchor="middle" className="text-sm fill-slate-700">R 450.75 - 45.2L</text>
            <rect x="140" y="290" width="180" height="25" fill="#fee2e2" stroke="#b91c1c" strokeWidth="1" rx="4"/>
            <text x="230" y="307" textAnchor="middle" className="text-xs fill-slate-600">Upload Receipt ✓</text>
            
            {/* Vehicle Checklist Panel - Dark Blue */}
            <rect x="380" y="130" width="240" height="200" fill="white" stroke="#1e3a8a" strokeWidth="3" rx="12"/>
            <text x="500" y="155" textAnchor="middle" className="text-lg font-bold fill-slate-800">Vehicle Checklist</text>
            <CheckSquare x="460" y="170" width="80" height="80" className="stroke-blue-800 fill-none" strokeWidth="2"/>
            
            {/* Checklist Items - British Colors */}
            <g>
              <rect x="400" y="260" width="15" height="15" fill="#dc2626" rx="2"/>
              <text x="425" y="272" className="text-sm fill-slate-700">Tyres ✓</text>
            </g>
            <g>
              <rect x="400" y="280" width="15" height="15" fill="#dc2626" rx="2"/>
              <text x="425" y="292" className="text-sm fill-slate-700">Lights ✓</text>
            </g>
            <g>
              <rect x="520" y="260" width="15" height="15" fill="#1e3a8a" rx="2"/>
              <text x="545" y="272" className="text-sm fill-slate-700">Oil Pending</text>
            </g>
            <g>
              <rect x="520" y="280" width="15" height="15" fill="#dc2626" rx="2"/>
              <text x="545" y="292" className="text-sm fill-slate-700">Brakes ✓</text>
            </g>
            
            {/* Maintenance Board Panel - Dark Blue */}
            <rect x="660" y="130" width="220" height="200" fill="white" stroke="#1e3a8a" strokeWidth="3" rx="12"/>
            <text x="770" y="155" textAnchor="middle" className="text-lg font-bold fill-slate-800">Maintenance Board</text>
            <Wrench x="730" y="170" width="80" height="80" className="stroke-blue-800 fill-none" strokeWidth="2"/>
            
            {/* Trello-style Cards - British Theme */}
            <rect x="680" y="260" width="60" height="20" fill="#dbeafe" stroke="#1e3a8a" strokeWidth="1" rx="4"/>
            <text x="710" y="273" textAnchor="middle" className="text-xs fill-slate-700">To Do</text>
            
            <rect x="750" y="260" width="60" height="20" fill="#fef2f2" stroke="#dc2626" strokeWidth="1" rx="4"/>
            <text x="780" y="273" textAnchor="middle" className="text-xs fill-slate-700">In Progress</text>
            
            <rect x="680" y="290" width="60" height="20" fill="white" stroke="#6b7280" strokeWidth="1" rx="4"/>
            <text x="710" y="303" textAnchor="middle" className="text-xs fill-slate-700">Complete</text>
            
            <rect x="750" y="290" width="60" height="20" fill="#fee2e2" stroke="#dc2626" strokeWidth="1" rx="4"/>
            <text x="780" y="303" textAnchor="middle" className="text-xs fill-slate-700">Urgent</text>
          </g>
        )}
        
        {/* Scene 4: MoovScore Performance Analytics */}
        {currentScene === 3 && (
          <g className="animate-fade-in">
            <text x="500" y="60" textAnchor="middle" className="text-3xl font-bold fill-slate-800">
              MoovScore™ Driver Performance Analytics
            </text>
            <text x="500" y="90" textAnchor="middle" className="text-lg fill-slate-600">
              AI-powered behavior analysis and performance optimization
            </text>
            
            {/* White Background */}
            <rect x="150" y="120" width="700" height="280" fill="white" stroke="#e5e7eb" strokeWidth="2" rx="16"/>
            
            {/* MoovScore Logo */}
            <text x="400" y="160" textAnchor="middle" className="text-2xl font-bold fill-slate-800">MoovScore</text>
            
            {/* Main MoovScore Circle */}
            <circle cx="400" cy="240" r="60" fill="white" stroke="#4285f4" strokeWidth="8"/>
            <circle cx="400" cy="240" r="45" fill="none" stroke="#4285f4" strokeWidth="8" 
                    strokeDasharray="283" strokeDashoffset="85" strokeLinecap="round">
              <animate attributeName="stroke-dashoffset" values="283;85;125;60;85" dur="6s" repeatCount="indefinite"/>
            </circle>
            <text x="400" y="250" textAnchor="middle" className="text-3xl fill-slate-800 font-bold">82</text>
            <circle cx="385" cy="270" r="2" fill="#cbd5e1"/>
            <circle cx="400" cy="270" r="2" fill="#cbd5e1"/>
            <circle cx="415" cy="270" r="2" fill="#cbd5e1"/>
            
            {/* Driver Name */}
            <text x="400" y="300" textAnchor="middle" className="text-xs fill-slate-500 font-medium">PRIDS</text>
            <text x="400" y="320" textAnchor="middle" className="text-lg fill-slate-800 font-medium">Rosen Trier</text>
            
            {/* Performance Metrics Cards */}
            <rect x="520" y="150" width="140" height="70" fill="white" stroke="#e5e7eb" strokeWidth="2" rx="8"/>
            <text x="590" y="175" textAnchor="middle" className="text-lg font-bold fill-slate-800">95%</text>
            <text x="590" y="195" textAnchor="middle" className="text-sm fill-slate-600">Safe Driving</text>
            <text x="590" y="210" textAnchor="middle" className="text-xs fill-green-600">+3% this month</text>
            
            <rect x="680" y="150" width="140" height="70" fill="white" stroke="#e5e7eb" strokeWidth="2" rx="8"/>
            <text x="750" y="175" textAnchor="middle" className="text-lg font-bold fill-slate-800">18%</text>
            <text x="750" y="195" textAnchor="middle" className="text-sm fill-slate-600">Fuel Savings</text>
            <text x="750" y="210" textAnchor="middle" className="text-xs fill-green-600">R2,450 saved</text>
            
            <rect x="520" y="240" width="140" height="70" fill="white" stroke="#e5e7eb" strokeWidth="2" rx="8"/>
            <text x="590" y="265" textAnchor="middle" className="text-lg font-bold fill-slate-800">8.2</text>
            <text x="590" y="285" textAnchor="middle" className="text-sm fill-slate-600">Efficiency Score</text>
            <text x="590" y="300" textAnchor="middle" className="text-xs fill-blue-600">Industry leading</text>
            
            <rect x="680" y="240" width="140" height="70" fill="white" stroke="#e5e7eb" strokeWidth="2" rx="8"/>
            <text x="750" y="265" textAnchor="middle" className="text-lg font-bold fill-slate-800">99.2%</text>
            <text x="750" y="285" textAnchor="middle" className="text-sm fill-slate-600">On-Time Rate</text>
            <text x="750" y="300" textAnchor="middle" className="text-xs fill-green-600">Best in fleet</text>
            
            {/* Driver Performance List */}
            <rect x="170" y="180" width="140" height="140" fill="white" stroke="#e5e7eb" strokeWidth="2" rx="8"/>
            <text x="240" y="205" textAnchor="middle" className="text-sm font-bold fill-slate-800">Fleet Rankings</text>
            
            <circle cx="190" cy="225" r="8" fill="#4285f4"/>
            <text x="210" y="230" className="text-xs fill-slate-700">John S. - 94</text>
            
            <circle cx="190" cy="245" r="8" fill="#34d399"/>
            <text x="210" y="250" className="text-xs fill-slate-700">Sarah M. - 91</text>
            
            <circle cx="190" cy="265" r="8" fill="#60a5fa"/>
            <text x="210" y="270" className="text-xs fill-slate-700">Mike R. - 89</text>
            
            <circle cx="190" cy="285" r="8" fill="#fbbf24"/>
            <text x="210" y="290" className="text-xs fill-slate-700">Lisa K. - 86</text>
            
            <circle cx="190" cy="305" r="8" fill="#ef4444"/>
            <text x="210" y="310" className="text-xs fill-slate-700">Rosen T. - 82</text>
          </g>
        )}
        
        {/* Progress Indicators */}
        <g transform="translate(450, 470)">
          {[0, 1, 2, 3].map((index) => (
            <circle
              key={index}
              cx={index * 25}
              cy="0"
              r="5"
              fill={index === currentScene ? "#3b82f6" : "#cbd5e1"}
              className="transition-all duration-500"
            />
          ))}
        </g>
        
        {/* Moovly Branding */}
        <rect x="20" y="450" width="160" height="35" fill="white" stroke="#e2e8f0" strokeWidth="2" rx="8"/>
        <text x="100" y="472" textAnchor="middle" className="text-sm fill-slate-700 font-bold">
          Powered by Moovly
        </text>
      </svg>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          .animate-fade-in {
            animation: fadeIn 1.5s ease-in-out;
          }
          
          .smooth-pulse {
            animation: smoothPulse 3s ease-in-out infinite;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes smoothPulse {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1; }
          }
        `
      }} />
    </div>
  );
};

export default AnimatedLogisticsVideo;