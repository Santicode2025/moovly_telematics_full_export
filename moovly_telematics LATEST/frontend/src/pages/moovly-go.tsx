import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoovlyGoBirdLogo } from "@/components/ui/moovly-go-bird-logo";
import { CheckCircle, Users, User, ArrowRight, BarChart3, MapPin, Clock, Truck, Zap, Target, Star } from "lucide-react";

export default function MoovlyGo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center shadow-lg">
              <MoovlyGoBirdLogo size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Moovly Go</h1>
              <p className="text-sm text-sky-600 font-medium">Load. Plan. Deliver.</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/moovly-go/login">
              <Button variant="outline" className="hidden sm:flex">Sign In</Button>
            </Link>
            <Link href="/moovly-go/register">
              <Button className="bg-sky-500 hover:bg-sky-600">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="bg-sky-100 text-sky-800 border-sky-200">
                Save Time • Save Fuel • Earn More
              </Badge>
              <h2 className="text-4xl lg:text-6xl font-bold text-slate-900 leading-tight">
                Optimize Your Route,
                <span className="text-sky-600 block">Maximize Your Day</span>
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                Scan packages, optimize routes with LIFO awareness, and finish up to 1 hour earlier. 
                The smart delivery app that adapts to how you load your vehicle.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-slate-700">Finish work up to 1 hour earlier</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-slate-700">Avoid traffic automatically</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-slate-700">No manual route planning</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-slate-700">Works with Google Maps & Waze</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/moovly-go/register">
                <Button size="lg" className="w-full sm:w-auto bg-sky-500 hover:bg-sky-600 text-lg px-8">
                  Start 14-Day Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/moovly-go/demo">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8">
                  Watch Demo
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-8 relative z-10">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">Today's Route</h3>
                  <Badge className="bg-green-100 text-green-800">12 stops</Badge>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">1</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">Pick n Pay Clothing</p>
                      <p className="text-sm text-slate-600">Canal Walk, Century City</p>
                    </div>
                    <MapPin className="w-4 h-4 text-slate-400" />
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">2</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">Woolworths Food</p>
                      <p className="text-sm text-slate-600">V&A Waterfront</p>
                    </div>
                    <MapPin className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Estimated Savings</p>
                      <p className="text-2xl font-bold text-green-700">45 min</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Distance Saved</p>
                      <p className="text-2xl font-bold text-blue-700">12 km</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-100 rounded-full opacity-60"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-green-100 rounded-full opacity-40"></div>
          </div>
        </div>
      </section>

      {/* Pricing Tabs */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Choose Your Plan</h2>
            <div className="flex justify-center mb-8">
              <div className="bg-slate-100 p-1 rounded-lg flex">
                <button className="px-6 py-2 bg-white rounded text-blue-600 font-medium shadow-sm">
                  For Drivers
                </button>
                <button className="px-6 py-2 text-slate-600 hover:text-slate-900">
                  For Teams
                </button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Individual Plan */}
            <Card className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <User className="w-8 h-8 text-blue-600" />
                  <Badge variant="secondary">Most Popular</Badge>
                </div>
                <CardTitle className="text-2xl">Individual Driver</CardTitle>
                <CardDescription>Perfect for independent drivers</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold text-slate-900">R149</span>
                  <span className="text-slate-600">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Unlimited route optimization</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Barcode & address scanning</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>LIFO-aware routing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Savings tracking</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Offline mode</span>
                  </div>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            {/* Team Starter Plan */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Users className="w-8 h-8 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl">Team Starter</CardTitle>
                <CardDescription>For small delivery teams</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold text-slate-900">R299</span>
                  <span className="text-slate-600">/month</span>
                </div>
                <p className="text-sm text-slate-600">Up to 3 drivers</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Everything in Individual</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Team dashboard</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Driver performance tracking</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Customer notifications</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Basic analytics</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            {/* Business Plan */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Truck className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-2xl">Business</CardTitle>
                <CardDescription>For growing delivery operations</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold text-slate-900">R599</span>
                  <span className="text-slate-600">/month</span>
                </div>
                <p className="text-sm text-slate-600">Up to 10 drivers</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Everything in Team Starter</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Advanced analytics</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>API integration</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Custom branding</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Priority support</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Built for Real Drivers</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Every feature designed to save you time, fuel, and stress on the road.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <Zap className="w-12 h-12 text-yellow-500 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Quick Package Intake</h3>
              <p className="text-slate-600">
                Scan barcodes, use voice commands, or type addresses. Add 20+ stops in under 5 minutes.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm">
              <Target className="w-12 h-12 text-red-500 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-3">LIFO-Aware Routing</h3>
              <p className="text-slate-600">
                Smart optimization that considers how you loaded your vehicle. No more digging through packages.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm">
              <Clock className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Time Window Management</h3>
              <p className="text-slate-600">
                Handle priority deliveries and scheduled appointments with automatic route adjustment.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm">
              <MapPin className="w-12 h-12 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Works Offline</h3>
              <p className="text-slate-600">
                Route optimization and navigation work without internet. Sync when connectivity returns.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm">
              <BarChart3 className="w-12 h-12 text-purple-500 mb-4" />
              <h3 className="text-xl font-semibent text-slate-900 mb-3">Savings Tracking</h3>
              <p className="text-slate-600">
                See exactly how much time and distance you save every day. Gamified experience with achievements.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm">
              <Star className="w-12 h-12 text-orange-500 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Proof of Delivery</h3>
              <p className="text-slate-600">
                Capture photos, signatures, and notes. Export complete delivery reports with one tap.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Finish Work Earlier?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of drivers who save time and fuel every day with Moovly Go.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/moovly-go/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8">
                Start 14-Day Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/moovly-go/demo">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8">
                See How It Works
              </Button>
            </Link>
          </div>
          <p className="text-blue-100 text-sm mt-4">No credit card required • Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                    <path d="M8 3C7.5 3 7 3.5 7 4V6H5C4.5 6 4 6.5 4 7V20C4 20.5 4.5 21 5 21H8V19H6V8H8V20C8 20.5 8.5 21 9 21H11C11.5 21 12 20.5 12 20V4C12 3.5 11.5 3 11 3H8Z" fill="currentColor"/>
                  </svg>
                </div>
                <span className="text-xl font-bold text-white">Moovly Go</span>
              </div>
              <p className="text-sm text-slate-400">
                Load. Plan. Deliver. <br />
                The smart route optimization app for drivers who want to finish earlier.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <div className="space-y-2 text-sm">
                <Link href="/moovly-go/features" className="block hover:text-white">Features</Link>
                <Link href="/moovly-go/pricing" className="block hover:text-white">Pricing</Link>
                <Link href="/moovly-go/demo" className="block hover:text-white">Demo</Link>
                <Link href="/mobile" className="block hover:text-white">Mobile App</Link>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <div className="space-y-2 text-sm">
                <Link href="/about" className="block hover:text-white">About</Link>
                <Link href="/contact" className="block hover:text-white">Contact</Link>
                <Link href="/support" className="block hover:text-white">Support</Link>
                <Link href="/careers" className="block hover:text-white">Careers</Link>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <div className="space-y-2 text-sm">
                <Link href="/privacy" className="block hover:text-white">Privacy Policy</Link>
                <Link href="/terms" className="block hover:text-white">Terms of Service</Link>
                <Link href="/security" className="block hover:text-white">Security</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-8 text-center">
            <p className="text-sm text-slate-400">
              © 2025 Moovly Go. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}