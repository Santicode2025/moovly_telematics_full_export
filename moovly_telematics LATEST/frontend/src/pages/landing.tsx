import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Truck, Route, ClipboardList, BarChart3, Wrench, Shield, Smartphone, Mail, Phone, Globe, Check, DollarSign, MessageSquare, Navigation, Activity, Menu, X, Play, ExternalLink, MapPin, User, CheckCircle, TrendingUp, Database, Server, Code, Zap, Layers, GitBranch, Settings, Clock } from "lucide-react";
import { SiWhatsapp, SiReact, SiTypescript, SiTailwindcss, SiNodedotjs, SiPostgresql, SiGit, SiSocketdotio, SiExpo } from "react-icons/si";

import { useState, useEffect } from "react";
// Using SVG logos and screenshots to reduce bundle size
const MiniCooperLogo = () => (
  <svg width="200" height="100" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="40" y="35" width="120" height="50" rx="25" fill="#d1d5db" stroke="#374151" strokeWidth="2"/>
    <circle cx="70" cy="75" r="15" fill="#374151"/>
    <circle cx="130" cy="75" r="15" fill="#374151"/>
    <rect x="60" y="25" width="80" height="40" rx="8" fill="#9ca3af"/>
  </svg>
);

const MoovlyLandingLogo = () => (
  <svg width="150" height="50" viewBox="0 0 150 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="150" height="50" rx="10" fill="#1e3a8a"/>
    <text x="75" y="32" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="bold" fill="white" textAnchor="middle">Moovly</text>
  </svg>
);
import adminDashboardScreenshot from "@assets/Screenshot_20250826_141649_Chrome_1756210959437.jpg";
import AnimatedLogisticsVideo from "@/components/animated-logistics-video";

// Technology Stack Component
const TechnologyStackSection = () => {
  const [activeTab, setActiveTab] = useState('Frontend');

  const techCategories = {
    Frontend: [
      { name: 'React', icon: SiReact, color: 'text-blue-500', description: 'UI Framework' },
      { name: 'TypeScript', icon: SiTypescript, color: 'text-[#00A8CC]', description: 'Type Safety' },
      { name: 'Tailwind CSS', icon: SiTailwindcss, color: 'text-cyan-500', description: 'Styling' },
      { name: 'Vite', icon: Zap, color: 'text-yellow-500', description: 'Build Tool' }
    ],
    Backend: [
      { name: 'Node.js', icon: SiNodedotjs, color: 'text-green-600', description: 'Runtime' },
      { name: 'Express.js', icon: Server, color: 'text-gray-700', description: 'Web Framework' },
      { name: 'Socket.io', icon: SiSocketdotio, color: 'text-gray-900', description: 'Real-time' }
    ],
    Database: [
      { name: 'PostgreSQL', icon: SiPostgresql, color: 'text-blue-700', description: 'Database' },
      { name: 'Drizzle ORM', icon: Database, color: 'text-green-700', description: 'Database ORM' }
    ],
    Mobile: [
      { name: 'React Native', icon: Smartphone, color: 'text-purple-600', description: 'Mobile Framework' },
      { name: 'Expo', icon: SiExpo, color: 'text-gray-900', description: 'Mobile Platform' }
    ]
  };

  const getCurrentTechnologies = () => {
    return techCategories[activeTab as keyof typeof techCategories] || [];
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Technology Stack We Use for Fleet Management Excellence
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Built with enterprise-grade technologies for reliability, scalability, and performance.
          </p>
        </div>

        {/* Technology Categories Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            {Object.keys(techCategories).map((category) => (
              <button 
                key={category}
                onClick={() => setActiveTab(category)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === category 
                    ? 'bg-[#00A8CC] text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Technology Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto min-h-[200px]">
          {getCurrentTechnologies().map((tech: any) => {
            const IconComponent = tech.icon;
            return (
              <div key={tech.name} className="text-center group">
                <div className="w-16 h-16 mx-auto mb-3 bg-white rounded-lg shadow-md border border-gray-200 flex items-center justify-center group-hover:shadow-lg transition-shadow">
                  <IconComponent className={`h-8 w-8 ${tech.color}`} />
                </div>
                <p className="text-sm font-medium text-gray-900">{tech.name}</p>
                <p className="text-xs text-gray-500">{tech.description}</p>
              </div>
            );
          })}
        </div>

        {/* Technology Benefits */}
        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="text-center p-6 bg-[#00A8CC]/10 rounded-xl">
            <Layers className="h-8 w-8 text-[#00A8CC] mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Modern Architecture</h3>
            <p className="text-sm text-gray-600">
              Full-stack TypeScript with modern React patterns for maintainable, scalable code.
            </p>
          </div>
          
          <div className="text-center p-6 bg-green-50 rounded-xl">
            <Shield className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Secure & Reliable</h3>
            <p className="text-sm text-gray-600">
              PostgreSQL with encrypted data storage and secure authentication for fleet operations.
            </p>
          </div>
          
          <div className="text-center p-6 bg-purple-50 rounded-xl">
            <Zap className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">High Performance</h3>
            <p className="text-sm text-gray-600">
              Optimized build tools and real-time capabilities for instant fleet management updates.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// Currency conversion rates (USD base)
const CURRENCY_RATES = {
  USD: { symbol: '$', rate: 1, name: 'USD' },
  GBP: { symbol: '£', rate: 0.79, name: 'GBP' },
  EUR: { symbol: '€', rate: 0.92, name: 'EUR' },
  AUD: { symbol: 'A$', rate: 1.52, name: 'AUD' },
  NZD: { symbol: 'NZ$', rate: 1.67, name: 'NZD' },
  ZAR: { symbol: 'R', rate: 18.50, name: 'ZAR' },
  CAD: { symbol: 'C$', rate: 1.36, name: 'CAD' }
};

// Country flag and currency mapping
const COUNTRY_CONFIG = {
  ZA: { flag: 'https://flagcdn.com/za.svg', currency: 'ZAR', name: 'South Africa' },
  US: { flag: 'https://flagcdn.com/us.svg', currency: 'USD', name: 'United States' },
  GB: { flag: 'https://flagcdn.com/gb.svg', currency: 'GBP', name: 'United Kingdom' },
  AU: { flag: 'https://flagcdn.com/au.svg', currency: 'AUD', name: 'Australia' },
  NZ: { flag: 'https://flagcdn.com/nz.svg', currency: 'NZD', name: 'New Zealand' },
  CA: { flag: 'https://flagcdn.com/ca.svg', currency: 'CAD', name: 'Canada' },
  IE: { flag: 'https://flagcdn.com/ie.svg', currency: 'EUR', name: 'Ireland' }
};

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState("features");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual");
  const [detectedCountry, setDetectedCountry] = useState<string>("MT");
  const [flagUrl, setFlagUrl] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeInterface, setActiveInterface] = useState<'customer' | 'admin' | 'driver'>('customer');
  
  // WhatsApp Configuration - Replace with your business number
  const WHATSAPP_NUMBER = "YOUR_WHATSAPP_NUMBER"; // Format: +27123456789
  const WHATSAPP_MESSAGE = "Hi! I'm interested in Moovly fleet management. Can you help me get started?";
  
  const openWhatsApp = () => {
    const encodedMessage = encodeURIComponent(WHATSAPP_MESSAGE);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };


  // Auto-detect country and handle domain-specific setup
  useEffect(() => {
    const detectCountryAndDomain = async () => {
      try {
        // Check if user is on South African domain
        const isSouthAfricanDomain = window.location.hostname.includes('moovly.co.za');
        
        if (isSouthAfricanDomain) {
          // Force South African settings for .co.za domain
          setDetectedCountry("ZA");
          setFlagUrl(COUNTRY_CONFIG.ZA.flag);
          setSelectedCurrency("ZAR");
          return;
        }
        
        // Use geolocation API to detect country for international domain
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const countryCode = data?.country_code;
        
        // Check if it's a supported English-speaking country and config exists
        if (countryCode && COUNTRY_CONFIG[countryCode as keyof typeof COUNTRY_CONFIG]) {
          const config = COUNTRY_CONFIG[countryCode as keyof typeof COUNTRY_CONFIG];
          setDetectedCountry(countryCode);
          setFlagUrl(config.flag);
          setSelectedCurrency(config.currency);
        } else {
          // Fallback to default settings
          setDetectedCountry("MT"); // MT for Moovly/fallback
          setFlagUrl('');
          setSelectedCurrency("USD");
        }
      } catch (error) {
        console.log('Country detection failed, using fallback');
        setDetectedCountry("MT");
        setFlagUrl('');
        setSelectedCurrency("USD");
      }
    };
    
    detectCountryAndDomain();
  }, []);

  // Base USD prices
  const BASE_PRICES = {
    monthly: 7,
    annual: 5 // 2 months free (7 * 10 / 12 = 5.83, rounded to 5)
  };

  const convertPrice = (usdPrice: number) => {
    const currency = CURRENCY_RATES[selectedCurrency as keyof typeof CURRENCY_RATES];
    const convertedPrice = usdPrice * currency.rate;
    return {
      amount: Math.round(convertedPrice),
      symbol: currency.symbol,
      currency: currency.name
    };
  };

  const getCurrentPrice = () => {
    return convertPrice(BASE_PRICES[billingPeriod]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header - Desktop First, Mobile Responsive */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#00A8CC] rounded-lg flex items-center justify-center">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-gray-900">
                <span className="relative">
                  Moovly
                  <span className="absolute bottom-0 left-0 w-full h-1 bg-[#00A8CC]"></span>
                </span>
                {" "}Telematics
              </span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-8">
              {/* Desktop Navigation - Always Visible */}
              <nav className="hidden md:flex space-x-6 lg:space-x-8">
                <button 
                  onClick={() => setActiveTab("features")}
                  className={`text-sm lg:text-base font-medium transition-colors px-3 py-2 rounded-md ${
                    activeTab === "features" 
                      ? "text-[#00A8CC] bg-[#00A8CC]/10" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Features
                </button>
                <button 
                  onClick={() => setActiveTab("pricing")}
                  className={`text-sm lg:text-base font-medium transition-colors px-3 py-2 rounded-md ${
                    activeTab === "pricing" 
                      ? "text-[#00A8CC] bg-[#00A8CC]/10" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Pricing
                </button>
                <button 
                  onClick={() => setActiveTab("company")}
                  className={`text-sm lg:text-base font-medium transition-colors px-3 py-2 rounded-md ${
                    activeTab === "company" 
                      ? "text-[#00A8CC] bg-[#00A8CC]/10" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Company
                </button>
                <button 
                  onClick={() => setActiveTab("legal")}
                  className={`text-sm lg:text-base font-medium transition-colors px-3 py-2 rounded-md ${
                    activeTab === "legal" 
                      ? "text-[#00A8CC] bg-[#00A8CC]/10" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Legal
                </button>
              </nav>
              
              {/* Mobile Menu Button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-md transition-colors"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Link href="/login">
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2 text-sm sm:text-base px-3 sm:px-6 py-2 text-gray-600 border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    {flagUrl && (
                      <img 
                        src={flagUrl} 
                        alt="Country Flag" 
                        className="w-4 sm:w-6 h-3 sm:h-4 object-contain border border-gray-300 rounded-sm"
                      />
                    )}
                    <span className="hidden sm:inline">Login</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
              <div className="flex flex-col space-y-2 pt-4">
                <button 
                  onClick={() => {
                    setActiveTab("features");
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left px-4 py-2 text-base font-medium transition-colors rounded-md ${
                    activeTab === "features" 
                      ? "text-[#00A8CC] bg-[#00A8CC]/10" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Features
                </button>
                <button 
                  onClick={() => {
                    setActiveTab("pricing");
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left px-4 py-2 text-base font-medium transition-colors rounded-md ${
                    activeTab === "pricing" 
                      ? "text-[#00A8CC] bg-[#00A8CC]/10" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Pricing
                </button>
                <button 
                  onClick={() => {
                    setActiveTab("company");
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left px-4 py-2 text-base font-medium transition-colors rounded-md ${
                    activeTab === "company" 
                      ? "text-[#00A8CC] bg-[#00A8CC]/10" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Company
                </button>
                <button 
                  onClick={() => {
                    setActiveTab("legal");
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left px-4 py-2 text-base font-medium transition-colors rounded-md ${
                    activeTab === "legal" 
                      ? "text-[#00A8CC] bg-[#00A8CC]/10" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Legal
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Secondary Mobile Tab Bar for Small Screens */}
        <div className="sm:hidden bg-gray-50 border-t border-gray-200">
          <div className="flex overflow-x-auto">
            {[
              { key: "features", label: "Features" },
              { key: "pricing", label: "Pricing" },
              { key: "company", label: "Company" },
              { key: "legal", label: "Legal" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === key 
                    ? "text-[#00A8CC] border-[#00A8CC] bg-[#00A8CC]/10" 
                    : "text-gray-600 border-transparent hover:text-gray-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero Section - Desktop First, Mobile Responsive */}
      <section className="relative bg-white py-12 sm:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="order-1 lg:order-1">
              {/* Meet Moovly Mini Cooper */}
              <div className="mb-6 lg:mb-10 flex justify-center lg:justify-start">
                <MiniCooperLogo />
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6 lg:mb-8 text-center lg:text-left">
                Smarter Fleet. <br/>
                Smarter Business.
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-8 lg:mb-10 leading-relaxed text-center lg:text-left">
                Track your drivers, optimize jobs, and digitize delivery operations with our comprehensive fleet management platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center lg:justify-start">
                <Link href="/login">
                  <Button 
                    size="lg" 
                    className="bg-[#00A8CC] hover:bg-[#0097B8] text-white text-base sm:text-lg lg:text-xl px-6 sm:px-8 lg:px-10 py-3 lg:py-4 order-1"
                  >
                    Get Started
                  </Button>
                </Link>
                {WHATSAPP_NUMBER !== "YOUR_WHATSAPP_NUMBER" && (
                  <Button 
                    onClick={openWhatsApp}
                    size="lg" 
                    variant="outline"
                    className="text-base sm:text-lg lg:text-xl px-6 sm:px-8 lg:px-10 py-3 lg:py-4 border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-3 order-2"
                  >
                    <SiWhatsapp className="w-5 h-5 sm:w-6 sm:h-6" />
                    Chat on WhatsApp
                  </Button>
                )}
              </div>
            </div>
            <div className="relative order-2 lg:order-2">
              {/* Animated Fleet Management Video */}
              <AnimatedLogisticsVideo />
            </div>
          </div>
        </div>
      </section>

      {/* Content Section - Features and Company - Desktop First, Mobile Responsive */}
      <section className="py-12 sm:py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === "features" && (
            <>
              <div className="text-center mb-12 sm:mb-16 lg:mb-20">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 lg:mb-6">Complete Fleet Management Solution</h2>
                <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto">
                  Everything you need to optimize your fleet operations, reduce costs, and improve customer satisfaction.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
                <div className="text-center p-4 sm:p-6 lg:p-8">
                  <div className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 bg-[#424242] rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-5 lg:mb-6">
                    <Smartphone className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 text-[#00A8CC]" />
                  </div>
                  <h3 className="text-xl sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 lg:mb-4">Mobile-First Technology</h3>
                  <p className="text-base sm:text-base lg:text-lg text-gray-600"><span className="relative">Moovly<span className="absolute bottom-0 left-0 w-full h-1 bg-[#00A8CC]"></span></span> Telematics is built on mobile-first technology, offering app-driven telematics turning every phone into a smart logistics tool.</p>
                </div>
                <div className="text-center p-4 sm:p-6">
                  <div className="w-16 h-16 bg-[#424242] rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Route className="h-8 w-8 text-[#00A8CC]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Real-Time Tracking</h3>
                  <p className="text-sm sm:text-base text-gray-600">Monitor vehicle locations, routes, and driver behavior in real-time with GPS tracking and analytics.</p>
                </div>
                <div className="text-center p-4 sm:p-6">
                  <div className="w-16 h-16 bg-[#424242] rounded-xl flex items-center justify-center mx-auto mb-4">
                    <ClipboardList className="h-8 w-8 text-[#00A8CC]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Job Management</h3>
                  <p className="text-sm sm:text-base text-gray-600">Assign, track, and optimize delivery jobs with automated routing and scheduling capabilities.</p>
                </div>
                <div className="text-center p-4 sm:p-6">
                  <div className="w-16 h-16 bg-[#424242] rounded-xl flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-8 w-8 text-[#00A8CC]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Advanced Analytics</h3>
                  <p className="text-sm sm:text-base text-gray-600">Gain insights into fleet performance, fuel consumption, and operational efficiency with detailed reports.</p>
                </div>
                <div className="text-center p-4 sm:p-6">
                  <div className="w-16 h-16 bg-[#424242] rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Wrench className="h-8 w-8 text-[#00A8CC]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Maintenance Tracking</h3>
                  <p className="text-sm sm:text-base text-gray-600">Schedule and track vehicle maintenance to prevent breakdowns and extend vehicle lifespan.</p>
                </div>
                <div className="text-center p-4 sm:p-6">
                  <div className="w-16 h-16 bg-[#424242] rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-[#00A8CC]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Driver Safety</h3>
                  <p className="text-sm sm:text-base text-gray-600">Monitor driver behavior, speed, and compliance to ensure safety and reduce insurance costs.</p>
                </div>
                <div className="text-center p-4 sm:p-6">
                  <div className="w-16 h-16 bg-[#424242] rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="h-8 w-8 text-[#00A8CC]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Mobile App</h3>
                  <p className="text-sm sm:text-base text-gray-600">Driver and manager mobile apps for on-the-go fleet management and communication.</p>
                </div>
                <div className="text-center p-4 sm:p-6">
                  <div className="w-16 h-16 bg-[#424242] rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Navigation className="h-8 w-8 text-[#00A8CC]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Route Deviation Alerts</h3>
                  <p className="text-sm sm:text-base text-gray-600">Automated notifications when drivers deviate from planned routes, ensuring optimal efficiency and customer satisfaction.</p>
                </div>
                <div className="text-center p-4 sm:p-6">
                  <div className="w-16 h-16 bg-[#424242] rounded-xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-[#00A8CC]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">In-App Messaging</h3>
                  <p className="text-sm sm:text-base text-gray-600">Seamless real-time communication between dispatchers and drivers for instant updates and coordination.</p>
                </div>
                <div className="text-center p-4 sm:p-6">
                  <div className="w-16 h-16 bg-[#424242] rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Activity className="h-8 w-8 text-[#00A8CC]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">MoovScore Tracking</h3>
                  <p className="text-sm sm:text-base text-gray-600">Comprehensive driver behavior analysis including speed, braking, acceleration, and overall performance scoring.</p>
                </div>
              </div>
            </>
          )}

          {activeTab === "pricing" && (
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
                <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                  Start with <span className="relative">Moovly<span className="absolute bottom-0 left-0 w-full h-1 bg-[#00A8CC]"></span></span> Connect and scale your operations. One plan, all features, no hidden costs.
                </p>
              </div>



              {/* Billing Period Toggle */}
              <div className="flex justify-center mb-6 sm:mb-8">
                <div className="bg-gray-100 p-1 rounded-lg flex items-center gap-1 w-full sm:w-auto max-w-md">
                  <button
                    onClick={() => setBillingPeriod("annual")}
                    className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2 rounded-md text-sm font-medium transition-all ${
                      billingPeriod === "annual" 
                        ? "bg-primary text-white" 
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <span className="hidden sm:inline">Annually (2 months free)</span>
                    <span className="sm:hidden">Annual</span>
                  </button>
                  <button
                    onClick={() => setBillingPeriod("monthly")}
                    className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2 rounded-md text-sm font-medium transition-all ${
                      billingPeriod === "monthly" 
                        ? "bg-primary text-white" 
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <span className="hidden sm:inline">Monthly (pay as you go)</span>
                    <span className="sm:hidden">Monthly</span>
                  </button>
                </div>
              </div>

              {/* Currency Selector */}
              <div className="flex justify-center mb-8 sm:mb-12">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <label className="text-sm font-medium text-gray-700">Select Currency:</label>
                  <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CURRENCY_RATES).map(([code, currency]) => (
                        <SelectItem key={code} value={code}>
                          {code} - {currency.symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Pricing Card */}
              <div className="max-w-md mx-auto">
                <Card className="relative bg-gradient-to-b from-primary/5 to-primary/10 border-primary/20 shadow-xl">
                  <CardContent className="p-8">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2"><span className="relative">Moovly<span className="absolute bottom-0 left-0 w-full h-1 bg-[#00A8CC]"></span></span> Connect</h3>
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="text-4xl font-bold text-primary">
                          {getCurrentPrice().symbol}{getCurrentPrice().amount}
                        </span>
                        <span className="text-gray-600">
                          {getCurrentPrice().currency}/user/month
                        </span>
                      </div>
                      {billingPeriod === "annual" && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Save 2 months • Best Value
                        </Badge>
                      )}
                    </div>

                    <div className="text-center mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        Always on the Move, Never Off-Track:
                      </h4>
                    </div>

                    <div className="space-y-3 mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-gray-700">Real-time tracking</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-gray-700">Smart notifications for arrivals</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-gray-700">Geofencing of job locations</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-gray-700">One-click route optimization</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-gray-700">Driver mobile app</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-gray-700">Basic maintenance tracking</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-gray-700">Route deviation alerts (planned vs actual)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-gray-700">MoovScore driver behavior tracking</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-gray-700">In-app messaging</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-gray-700">Fuel capture + Vehicle Checklist</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-gray-700">Offline work mode</span>
                      </div>
                    </div>

                    <Link href="/login">
                      <Button className="w-full bg-primary hover:bg-primary/90 text-lg py-3">
                        Start Free Trial
                      </Button>
                    </Link>
                    
                    <p className="text-center text-sm text-gray-500 mt-4">
                      No setup fees • Cancel anytime • 30-day free trial
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Currency Conversion Note */}
              <div className="text-center mt-12">
                <Card className="max-w-2xl mx-auto bg-[#00A8CC]/10 border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-[#00A8CC] mt-0.5" />
                      <div className="text-left">
                        <h4 className="font-semibold text-blue-900 mb-2">Global Pricing with Local Currency</h4>
                        <p className="text-sm text-blue-800 leading-relaxed">
                          All prices are based on live USD exchange rates. This ensures consistent global pricing 
                          while displaying costs in your preferred currency. Perfect for international teams and 
                          transparent billing.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* FAQ Section */}
              <div className="mt-16">
                <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">Frequently Asked Questions</h3>
                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  <Card className="p-6">
                    <CardContent className="p-0">
                      <h4 className="font-semibold text-gray-900 mb-2">How does the free trial work?</h4>
                      <p className="text-gray-600 text-sm">
                        Start with a 14-day free trial with full access to all Moovly Connect features. 
                        No credit card required to start.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="p-6">
                    <CardContent className="p-0">
                      <h4 className="font-semibold text-gray-900 mb-2">Can I change my billing period?</h4>
                      <p className="text-gray-600 text-sm">
                        Yes, you can switch between monthly and annual billing at any time. 
                        Annual plans save you 2 months compared to monthly pricing.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="p-6">
                    <CardContent className="p-0">
                      <h4 className="font-semibold text-gray-900 mb-2">What happens after the trial?</h4>
                      <p className="text-gray-600 text-sm">
                        Your trial automatically converts to a paid plan. You'll receive billing 
                        notifications before any charges occur.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="p-6">
                    <CardContent className="p-0">
                      <h4 className="font-semibold text-gray-900 mb-2">Is Moovly Business coming soon?</h4>
                      <p className="text-gray-600 text-sm">
                        Yes! Moovly Business with advanced features like Trello-style maintenance boards 
                        and AI optimization will launch 6+ months after Connect.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === "company" && (
            <div className="max-w-4xl mx-auto">
              {/* About Section */}
              <div className="mb-16">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">About <span className="relative">Moovly<span className="absolute bottom-0 left-0 w-full h-1 bg-[#00A8CC]"></span></span> Telematics</h2>
                </div>
                <Card className="p-8 mb-8">
                  <CardContent className="p-0">
                    <p className="text-lg text-gray-700 leading-relaxed">
                      <span className="relative">Moovly<span className="absolute bottom-0 left-0 w-full h-1 bg-[#00A8CC]"></span></span> Telematics is a smart, mobile-first fleet management platform built for courier teams, 
                      logistics companies, and mobile workforces. With live tracking, intelligent dispatching, 
                      automated alerts, and paperless checklists, <span className="relative">Moovly<span className="absolute bottom-0 left-0 w-full h-1 bg-[#00A8CC]"></span></span> empowers businesses to operate smarter, 
                      faster, and more efficiently.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Contact Us */}
                <Card className="p-6">
                  <CardContent className="p-0">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <Mail className="h-6 w-6 text-[#00A8CC]" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">Contact Us</h3>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Have questions or want to learn more about how <span className="relative">Moovly<span className="absolute bottom-0 left-0 w-full h-1 bg-[#00A8CC]"></span></span> can support your fleet operations? 
                      Our team is here to help.
                    </p>
                    <div className="flex items-center text-[#00A8CC]">
                      <Mail className="h-4 w-4 mr-2" />
                      <a href="mailto:hello@moovlytelematics.com?subject=Meet%20Moovly%20-%20Optimize%20your%20business" className="hover:underline">
                        hello@moovlytelematics.com
                      </a>
                    </div>
                  </CardContent>
                </Card>

                {/* Support */}
                <Card className="p-6">
                  <CardContent className="p-0">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                        <Shield className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">Support</h3>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Need technical assistance or help using the <span className="relative">Moovly<span className="absolute bottom-0 left-0 w-full h-1 bg-[#00A8CC]"></span></span> platform? Reach out to our support team anytime.
                    </p>
                    <div className="flex items-center text-green-600 mb-3">
                      <Mail className="h-4 w-4 mr-2" />
                      <a href="mailto:hello@moovlytelematics.com?subject=Meet%20Moovly%20-%20Optimize%20your%20business" className="hover:underline">
                        hello@moovlytelematics.com
                      </a>
                    </div>
                    <p className="text-sm text-gray-500">
                      We're committed to fast, friendly, and helpful support.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "legal" && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy and Terms of Use</h2>
                <p className="text-gray-600">Last updated: June 2025</p>
              </div>

              <div className="space-y-8">
                {/* Introduction */}
                <Card className="p-6">
                  <CardContent className="p-0">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h3>
                    <p className="text-gray-700 leading-relaxed">
                      Moovly Telematics ("Moovly," "we," "our," or "us") provides smart fleet management and telematics 
                      software through our platforms, including Moovly Connect, Moovly Business, and related mobile applications. 
                      By accessing our services or platforms, you agree to be bound by this Privacy Policy and Terms of Use.
                    </p>
                  </CardContent>
                </Card>

                {/* Privacy Policy */}
                <Card className="p-6">
                  <CardContent className="p-0">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Privacy Policy</h3>
                    <div className="space-y-4 text-gray-700 leading-relaxed">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">2.1 Data Collection</h4>
                        <p>We collect personal and operational data for the purpose of fleet tracking, analytics, driver compliance, 
                        route optimization, communication, and client management. This may include names, contact details, job history, 
                        GPS location, and usage logs.</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">2.2 Data Usage</h4>
                        <p>Data is used to provide, improve, and personalize our services. Moovly may use aggregated anonymized 
                        data for performance reports and analytics.</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">2.3 Data Sharing</h4>
                        <p>We do not sell personal data. Data may be shared with trusted partners only to provide core Moovly 
                        services (e.g., cloud storage, SMS alerts, GPS integrations) under strict confidentiality agreements.</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">2.4 Data Security</h4>
                        <p>All data is encrypted in transit and at rest. We use industry-standard practices to protect customer information.</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">2.5 Data Retention</h4>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Moovly Connect: Rolling 12-month data access</li>
                          <li>Moovly Business: Extended retention (12–36 months depending on plan)</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">2.6 User Rights</h4>
                        <p>Users may request access, correction, or deletion of their personal data by contacting: 
                        <a href="mailto:support@moovlytelematics.com" className="text-[#00A8CC] hover:underline ml-1">
                          support@moovlytelematics.com
                        </a></p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Terms of Use */}
                <Card className="p-6">
                  <CardContent className="p-0">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Terms of Use</h3>
                    <div className="space-y-4 text-gray-700 leading-relaxed">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">3.1 License and Access</h4>
                        <p>Moovly grants users a limited, non-exclusive, non-transferable license to use its software and 
                        platforms solely for business purposes.</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">3.2 User Conduct</h4>
                        <p>You agree to:</p>
                        <ul className="list-disc list-inside space-y-1 mt-2">
                          <li>Use Moovly lawfully and ethically</li>
                          <li>Maintain confidentiality of login credentials</li>
                          <li>Not misuse, reverse engineer, or disrupt services</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">3.3 Subscription & Payment</h4>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Free trial: 30 days for new customers</li>
                          <li>Billing: Monthly or annual (based on selected plan)</li>
                          <li>Refunds: Not offered once service is active</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">3.4 Termination</h4>
                        <p>We reserve the right to suspend accounts for breach of terms, non-payment, or abuse of the platform.</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">3.5 Intellectual Property</h4>
                        <p>All content, branding, and technology remain the property of Moovly Telematics. 
                        Clients retain ownership of their uploaded data.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Details */}
                <Card className="p-6">
                  <CardContent className="p-0">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">4. Contact Details</h3>
                    <div className="space-y-2 text-gray-700">
                      <p><strong>Email:</strong> 
                        <a href="mailto:hello@moovlytelematics.com?subject=Meet%20Moovly%20-%20Optimize%20your%20business" className="text-[#00A8CC] hover:underline ml-1">
                          hello@moovlytelematics.com
                        </a> / 
                        <a href="mailto:sales@moovlytelematics.com?subject=Meet%20Moovly%20-%20Optimize%20your%20business" className="text-[#00A8CC] hover:underline ml-1">
                          sales@moovlytelematics.com
                        </a>
                      </p>
                      <p><strong>Website:</strong> www.moovlytelematics.com</p>
                      <p><strong>Registered Company:</strong> Moovly Telematics (Pty) Ltd</p>
                      <p><strong>Registration No:</strong> 2025/424211/07</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Footer Note */}
                <div className="text-center text-sm text-gray-500 pt-6 border-t border-gray-200">
                  <p>By using our services, you acknowledge and agree to this policy. This document may be updated periodically. 
                  We encourage users to check back regularly for changes.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Platform Preview Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Experience Our Different Interfaces
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore the interfaces designed for your fleet management needs - from admin control to driver apps and customer tracking.
            </p>
          </div>

          {/* Interactive Interface Selector - Like Apptunix */}
          <div className="flex justify-center mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
              {/* Customer App Button */}
              <button
                onClick={() => setActiveInterface('customer')}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  activeInterface === 'customer'
                    ? 'border-gray-400 bg-gray-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center ${
                    activeInterface === 'customer' ? 'bg-gray-200' : 'bg-gray-100'
                  }`}>
                    <MapPin className={`h-6 w-6 ${
                      activeInterface === 'customer' ? 'text-gray-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <h3 className={`font-medium ${
                    activeInterface === 'customer' ? 'text-gray-700' : 'text-gray-700'
                  }`}>
                    Customer App
                  </h3>
                </div>
              </button>

              {/* Admin Panel Button */}
              <button
                onClick={() => setActiveInterface('admin')}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  activeInterface === 'admin'
                    ? 'border-gray-400 bg-gray-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center ${
                    activeInterface === 'admin' ? 'bg-gray-200' : 'bg-gray-100'
                  }`}>
                    <BarChart3 className={`h-6 w-6 ${
                      activeInterface === 'admin' ? 'text-gray-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <h3 className={`font-medium ${
                    activeInterface === 'admin' ? 'text-gray-700' : 'text-gray-700'
                  }`}>
                    Admin Panel
                  </h3>
                </div>
              </button>

              {/* Driver App Button */}
              <button
                onClick={() => setActiveInterface('driver')}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  activeInterface === 'driver'
                    ? 'border-gray-400 bg-gray-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center ${
                    activeInterface === 'driver' ? 'bg-gray-200' : 'bg-gray-100'
                  }`}>
                    <Smartphone className={`h-6 w-6 ${
                      activeInterface === 'driver' ? 'text-gray-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <h3 className={`font-medium ${
                    activeInterface === 'driver' ? 'text-gray-700' : 'text-gray-700'
                  }`}>
                    Driver App
                  </h3>
                </div>
              </button>
            </div>
          </div>

          {/* Dynamic Interface Content Based on Selection */}
          <div className="max-w-4xl mx-auto">
            {/* Customer Tracking Interface */}
            {activeInterface === 'customer' && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-[#00A8CC] to-[#0097B8] p-6 text-white text-center">
                  <h3 className="text-2xl font-bold mb-2">Customer Tracking</h3>
                  <p className="text-white/80">Real-time delivery tracking</p>
                </div>
                
                <div className="p-8">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="w-64 h-[500px] bg-gray-900 rounded-3xl p-3 shadow-2xl">
                        <div className="w-full h-full bg-white rounded-2xl overflow-hidden relative">
                          {/* Mobile tracking header */}
                          <div className="bg-gray-100 p-3 flex items-center justify-center">
                            <Badge className="bg-green-500 text-white text-xs">Online</Badge>
                          </div>
                          
                          {/* Map area */}
                          <div className="relative h-60 bg-gradient-to-br from-gray-100 to-gray-200">
                            {/* Route line */}
                            <svg className="absolute inset-0 w-full h-full">
                              <path 
                                d="M40 50 Q80 80, 120 100 T200 150 Q220 170, 230 190" 
                                stroke="#3b82f6" 
                                strokeWidth="3" 
                                fill="none"
                                strokeDasharray="5,5"
                              />
                            </svg>
                            
                            {/* Location markers */}
                            <div className="absolute top-12 left-8 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
                            <div className="absolute top-24 left-1/2 w-3 h-3 bg-[#00A8CC]/100 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                            <div className="absolute bottom-8 right-8 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
                            
                            {/* Labels */}
                            <div className="absolute top-16 left-12 text-xs text-gray-600 bg-white/80 px-1 rounded">Start</div>
                            <div className="absolute top-28 left-1/2 text-xs text-gray-600 bg-white/80 px-1 rounded">Driver</div>
                            <div className="absolute bottom-12 right-12 text-xs text-gray-600 bg-white/80 px-1 rounded">Delivery</div>
                          </div>
                          
                          {/* Driver info */}
                          <div className="p-4 bg-white border-t border-gray-200">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                              <div>
                                <div className="text-sm font-medium">Connor Chavez</div>
                                <div className="text-xs text-gray-500">★★★★☆ ST3751 - Toyota Vios</div>
                              </div>
                            </div>
                            
                            <div className="space-y-2 text-xs">
                              <div>
                                <div className="font-medium text-gray-700">Pick-Up</div>
                                <div className="text-gray-600">7958 Swift Village</div>
                              </div>
                              <div>
                                <div className="font-medium text-gray-700">Destination</div>
                                <div className="text-gray-600">105 William St, Chicago, US</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">Main panel used from the admin side to manage order and deliveries & can contact different delivery agents</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Live driver location</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Estimated arrival time</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Delivery notifications</span>
                      </div>
                    </div>
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3">
                      View Sample Tracking
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Panel Interface */}
            {activeInterface === 'admin' && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-[#00A8CC] to-[#0097B8] p-6 text-white text-center">
                  <h3 className="text-2xl font-bold mb-2">Admin Panel</h3>
                  <p className="text-blue-100">Full fleet management dashboard</p>
                </div>
                
                <div className="p-8">
                  <div className="bg-gray-50 rounded-xl p-6 mb-6">
                    <img 
                      src={adminDashboardScreenshot} 
                      alt="Moovly Admin Dashboard showing fleet statistics, driver management, and real-time tracking"
                      className="w-full h-72 object-cover rounded-lg shadow-lg border border-gray-200"
                    />
                  </div>
                  
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">Main panel used from the admin side to manage order and deliveries & can contact different delivery agents</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Real-time fleet dashboard</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Driver & vehicle management</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Job scheduling & routing</span>
                      </div>
                    </div>
                    <Link href="/login">
                      <Button className="bg-[#00A8CC] hover:bg-[#0097B8] text-white px-8 py-3">
                        Try Admin Panel
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Driver App Interface */}
            {activeInterface === 'driver' && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-[#00A8CC] to-[#0097B8] p-6 text-white text-center">
                  <h3 className="text-2xl font-bold mb-2">Driver App</h3>
                  <p className="text-white/80">Mobile-first driver interface</p>
                </div>
                
                <div className="p-8">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="w-64 h-[500px] bg-gray-900 rounded-3xl p-3 shadow-2xl">
                        <div className="w-full h-full bg-white rounded-2xl overflow-hidden relative">
                          {/* Mobile header */}
                          <div className="bg-blue-900 text-white p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-xs font-medium">John Smith</p>
                                <p className="text-xs text-blue-100">DL001237</p>
                              </div>
                            </div>
                            <Badge className="bg-green-500 text-white text-xs">Online</Badge>
                          </div>
                          
                          {/* Location info */}
                          <div className="p-3 bg-gray-50 border-b border-gray-200">
                            <div className="flex items-center gap-2 text-xs">
                              <MapPin className="h-3 w-3 text-red-500" />
                              <span className="text-gray-600">-34.1441, 18.8752</span>
                              <Clock className="h-3 w-3 text-gray-500 ml-2" />
                              <span className="text-gray-600">Shift ends: 01:59</span>
                            </div>
                          </div>
                          
                          {/* Tabs */}
                          <div className="flex border-b border-gray-200">
                            <div className="flex-1 py-2 text-center border-b-2 border-[#00A8CC]">
                              <MapPin className="h-4 w-4 mx-auto mb-1 text-[#00A8CC]" />
                              <span className="text-xs text-[#00A8CC] font-medium">Jobs</span>
                            </div>
                            <div className="flex-1 py-2 text-center">
                              <Route className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                              <span className="text-xs text-gray-400">Route</span>
                            </div>
                            <div className="flex-1 py-2 text-center">
                              <Activity className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                              <span className="text-xs text-gray-400">Score</span>
                            </div>
                          </div>
                          
                          {/* MoovScore section */}
                          <div className="p-4 text-center">
                            <div className="mb-2">
                              <Activity className="h-4 w-4 mx-auto mb-1 text-[#00A8CC]" />
                              <span className="text-sm font-medium text-gray-700">MoovScore</span>
                            </div>
                            <div className="text-3xl font-bold text-[#00A8CC] mb-2">88</div>
                            <div className="text-xs text-gray-600 mb-3">Your current driving score</div>
                            
                            {/* Progress bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                              <div className="bg-[#00A8CC] h-2 rounded-full" style={{width: '88%'}}></div>
                            </div>
                            <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                              Smooth Driving
                            </div>
                          </div>
                          
                          {/* Today's performance */}
                          <div className="p-3 border-t border-gray-200">
                            <div className="text-xs font-medium mb-2 text-gray-700">Today's Performance</div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="text-center">
                                <div className="text-green-600 font-bold">0</div>
                                <div className="text-gray-500">Harsh Events</div>
                              </div>
                              <div className="text-center">
                                <div className="text-green-600 font-bold">0</div>
                                <div className="text-gray-500">Speed Violations</div>
                              </div>
                              <div className="text-center">
                                <div className="text-[#00A8CC] font-bold">45</div>
                                <div className="text-gray-500">km/h Avg Speed</div>
                              </div>
                              <div className="text-center">
                                <div className="text-[#00A8CC] font-bold">3.2</div>
                                <div className="text-gray-500">Hours Driven</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">Mobile-first driver interface for job management and performance tracking</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Real-time job updates</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>MoovScore tracking</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>GPS navigation</span>
                      </div>
                    </div>
                    <Link href="/mobile">
                      <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3">
                        Try Driver App
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-12 hidden">
            {/* Admin Panel Preview */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-[#00A8CC] to-[#0097B8] p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold">Admin Panel</h3>
                </div>
                <p className="text-blue-100">Full fleet management dashboard</p>
              </div>
              
              <div className="p-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <img 
                    src={adminDashboardScreenshot} 
                    alt="Moovly Admin Dashboard showing fleet statistics, driver management, and real-time tracking"
                    className="w-full h-48 object-cover rounded-lg shadow-md border border-gray-200"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Real-time fleet dashboard</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Driver & vehicle management</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Job scheduling & routing</span>
                  </div>
                </div>
                <Link href="/login">
                  <Button className="w-full mt-4 bg-[#00A8CC] hover:bg-[#0097B8] text-white">
                    Try Admin Panel
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mobile Driver App Preview */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-[#00A8CC] to-[#0097B8] p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold">Driver App</h3>
                </div>
                <p className="text-white/80">Mobile-first driver interface</p>
              </div>
              
              <div className="p-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-4 flex justify-center">
                  <div className="relative">
                    <div className="w-48 h-96 bg-gray-900 rounded-3xl p-2 shadow-xl">
                      <div className="w-full h-full bg-white rounded-2xl overflow-hidden relative">
                        {/* Mobile mockup header */}
                        <div className="bg-blue-900 text-white p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-xs font-medium">John Smith</p>
                              <p className="text-xs opacity-75">DL001237</p>
                            </div>
                          </div>
                          <Badge className="bg-green-500 text-xs">Online</Badge>
                        </div>
                        
                        {/* Mobile content */}
                        <div className="p-3 space-y-3">
                          <div className="flex justify-between items-center text-xs text-gray-600">
                            <span>📍 -34.1441, 18.8752</span>
                            <span>⏰ Shift ends: 01:59</span>
                          </div>
                          
                          {/* Navigation tabs */}
                          <div className="flex justify-around border-b border-gray-200 pb-2">
                            <div className="text-center">
                              <MapPin className="h-4 w-4 mx-auto text-[#00A8CC]" />
                              <span className="text-xs text-[#00A8CC] font-medium">Jobs</span>
                            </div>
                            <div className="text-center">
                              <Route className="h-4 w-4 mx-auto text-gray-400" />
                              <span className="text-xs text-gray-400">Route</span>
                            </div>
                            <div className="text-center">
                              <TrendingUp className="h-4 w-4 mx-auto text-gray-400" />
                              <span className="text-xs text-gray-400">Score</span>
                            </div>
                          </div>
                          
                          {/* MoovScore card */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Activity className="h-4 w-4" />
                              <span className="text-sm font-medium">MoovScore</span>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-[#00A8CC] mb-1">88</div>
                              <div className="text-xs text-gray-600">Your current driving score</div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div className="bg-[#00A8CC] h-2 rounded-full" style={{width: '88%'}}></div>
                              </div>
                              <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded mt-2 inline-block">
                                Smooth Driving
                              </div>
                            </div>
                          </div>
                          
                          {/* Performance stats */}
                          <div className="bg-gray-50 rounded-lg p-2">
                            <div className="text-sm font-medium mb-2">Today's Performance</div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="text-center">
                                <div className="text-green-600 font-bold">0</div>
                                <div className="text-gray-500">Harsh Events</div>
                              </div>
                              <div className="text-center">
                                <div className="text-green-600 font-bold">0</div>
                                <div className="text-gray-500">Speed Violations</div>
                              </div>
                              <div className="text-center">
                                <div className="text-[#00A8CC] font-bold">45</div>
                                <div className="text-gray-500">km/h Avg Speed</div>
                              </div>
                              <div className="text-center">
                                <div className="text-[#00A8CC] font-bold">3.2</div>
                                <div className="text-gray-500">Hours Driven</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Real-time job updates</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>MoovScore tracking</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>GPS navigation</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Tracking Preview */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-[#00A8CC] to-[#0097B8] p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold">Customer Tracking</h3>
                </div>
                <p className="text-white/80">Real-time delivery tracking</p>
              </div>
              
              <div className="p-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-4 flex justify-center">
                  <div className="relative">
                    <div className="w-48 h-96 bg-gray-900 rounded-3xl p-2 shadow-xl">
                      <div className="w-full h-full bg-white rounded-2xl overflow-hidden relative">
                        {/* Mobile tracking header */}
                        <div className="bg-gray-100 p-3 flex items-center justify-center">
                          <Badge className="bg-green-500 text-white text-xs">Online</Badge>
                        </div>
                        
                        {/* Map area */}
                        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                          {/* Simplified map background */}
                          <div className="absolute inset-0 bg-gray-100">
                            {/* Route line */}
                            <svg className="absolute inset-0 w-full h-full">
                              <path 
                                d="M30 40 Q60 60, 90 80 T150 120 Q170 140, 180 160" 
                                stroke="#3b82f6" 
                                strokeWidth="3" 
                                fill="none"
                                strokeDasharray="5,5"
                              />
                            </svg>
                            
                            {/* Location markers */}
                            <div className="absolute top-8 left-6 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
                            <div className="absolute top-32 right-12 w-3 h-3 bg-[#00A8CC]/100 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                            <div className="absolute bottom-8 right-6 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
                            
                            {/* Street labels */}
                            <div className="absolute top-12 left-8 text-xs text-gray-600 bg-white/80 px-1 rounded">Start</div>
                            <div className="absolute top-36 right-8 text-xs text-gray-600 bg-white/80 px-1 rounded">Driver</div>
                            <div className="absolute bottom-12 right-8 text-xs text-gray-600 bg-white/80 px-1 rounded">Delivery</div>
                          </div>
                          
                          {/* Map controls */}
                          <div className="absolute top-2 left-2 bg-white rounded p-1 shadow">
                            <button className="w-6 h-6 flex items-center justify-center text-gray-600">+</button>
                          </div>
                          <div className="absolute top-2 right-2 bg-white rounded p-1 shadow">
                            <Navigation className="w-4 h-4 text-gray-600" />
                          </div>
                        </div>
                        
                        {/* Driver info */}
                        <div className="p-3 bg-white border-t border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                            <div>
                              <div className="text-sm font-medium">Connor Chavez</div>
                              <div className="text-xs text-gray-500">★★★★☆ ST3751 - Toyota Vios</div>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-xs">
                            <div>
                              <div className="font-medium text-gray-700">Pick-Up</div>
                              <div className="text-gray-600">7958 Swift Village</div>
                            </div>
                            <div>
                              <div className="font-medium text-gray-700">Destination</div>
                              <div className="text-gray-600">105 William St, Chicago, US</div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mt-3">
                            <button className="flex-1 bg-gray-100 text-gray-600 py-2 rounded text-xs">Ignore</button>
                            <button className="flex-1 bg-gray-900 text-white py-2 rounded text-xs">Accept</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Live driver location</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Estimated arrival time</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Delivery notifications</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <p className="text-lg text-gray-600 mb-6">
              Ready to transform your fleet management?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-[#00A8CC] hover:bg-[#0097B8] text-white"
                onClick={() => window.open('mailto:hello@moovlytelematics.com?subject=Meet%20Moovly%20-%20Optimize%20your%20business', '_blank')}
              >
                <Mail className="mr-2 h-5 w-5" />
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-gray-300"
                onClick={() => window.open('mailto:hello@moovlytelematics.com?subject=Meet%20Moovly%20-%20Optimize%20your%20business', '_blank')}
              >
                <Mail className="mr-2 h-5 w-5" />
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start with Moovly Connect and scale your operations. One plan, all features, no hidden costs.
            </p>
          </div>

          {/* Billing Period Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-white p-1 rounded-lg shadow-sm border flex items-center gap-1">
              <button
                onClick={() => setBillingPeriod("annual")}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                  billingPeriod === "annual" 
                    ? "bg-primary text-white shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Annually (2 months free)
              </button>
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                  billingPeriod === "monthly" 
                    ? "bg-primary text-white shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Monthly (pay as you go)
              </button>
            </div>
          </div>

          {/* Currency Selector */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm border">
              <label className="text-sm font-medium text-gray-700">Select Currency:</label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CURRENCY_RATES).map(([code, currency]) => (
                    <SelectItem key={code} value={code}>
                      {code} - {currency.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="max-w-md mx-auto">
            <Card className="relative bg-gradient-to-b from-primary/5 to-primary/10 border-primary/20 shadow-xl">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Moovly Connect</h3>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="text-5xl font-bold text-primary">
                      {getCurrentPrice().symbol}{getCurrentPrice().amount}
                    </span>
                    <div className="text-left">
                      <span className="text-gray-600 block">
                        {getCurrentPrice().currency}/user/month
                      </span>
                    </div>
                  </div>
                  {billingPeriod === "annual" && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                      Save 2 months • Best Value
                    </Badge>
                  )}
                </div>

                <div className="text-center mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Always on the Move, Never Off-Track:
                  </h4>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-gray-700">Real-time tracking</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-gray-700">Job management</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-gray-700">Driver performance</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-gray-700">Route optimization</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-gray-700">Customer alerts</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-gray-700">Mobile driver app</span>
                  </div>
                </div>

                <Button
                  onClick={() => window.open('mailto:hello@moovlytelematics.com?subject=Meet%20Moovly%20-%20Optimize%20your%20business', '_blank')}
                  className="w-full bg-primary hover:bg-primary/90 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Get Started Today
                </Button>

                <div className="text-center mt-4">
                  <p className="text-xs text-gray-500">
                    No setup fees • Cancel anytime • 24/7 support
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <TechnologyStackSection />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Truck className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold">
                <span className="relative">
                  Moovly
                  <span className="absolute bottom-0 left-0 w-full h-1 bg-[#00A8CC]"></span>
                </span>
                {" "}Telematics
              </span>
            </div>
            <p className="text-gray-400 mb-4">Revolutionizing fleet management with smart technology</p>
            <div className="flex justify-center space-x-6 mb-6">
              <a href="mailto:contact@moovlytelematics.com" className="text-gray-400 hover:text-white transition-colors">
                Contact
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Terms
              </a>
            </div>
            <p className="text-sm text-gray-500">© 2025 Moovly Telematics. All rights reserved.</p>
            <p className="text-sm mt-2">Company Registration: 2025/424211/07</p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      {WHATSAPP_NUMBER !== "YOUR_WHATSAPP_NUMBER" && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={openWhatsApp}
            className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
            title="Chat with us on WhatsApp"
          >
            <SiWhatsapp className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
          </Button>
        </div>
      )}
    </div>
  );
}
                <p className="text-gray-600 text-center max-w-2xl mx-auto text-lg">
                  Comprehensive fleet management dashboard with real-time analytics, job dispatch, and performance monitoring.
                </p>
