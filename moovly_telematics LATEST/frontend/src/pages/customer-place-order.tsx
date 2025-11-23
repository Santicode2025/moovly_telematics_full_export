import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Package, MapPin, Clock, DollarSign, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

const orderSchema = z.object({
  // Pickup details
  pickupName: z.string().min(2, "Name is required"),
  pickupPhone: z.string().min(10, "Valid phone number required"),
  pickupEmail: z.string().email("Valid email required").optional().or(z.literal("")),
  pickupAddress: z.string().min(5, "Pickup address is required"),
  pickupInstructions: z.string().optional(),
  
  // Delivery details  
  deliveryName: z.string().min(2, "Delivery name is required"),
  deliveryPhone: z.string().min(10, "Valid phone number required"),
  deliveryEmail: z.string().email("Valid email required").optional().or(z.literal("")),
  deliveryAddress: z.string().min(5, "Delivery address is required"),
  deliveryInstructions: z.string().optional(),
  
  // Address type
  addressType: z.enum(["street", "what3words"]),
  
  // Scheduling - Circuit-style priority system
  orderPriority: z.enum(["first", "auto", "last"]).default("auto"),
  jobType: z.enum(["delivery", "pickup"]).default("delivery"),
  arrivalTime: z.string().optional(), // HH:MM format or "Anytime"
  timeAtStop: z.number().min(1).max(60).default(5), // minutes
  
  // Package details
  packageDescription: z.string().min(3, "Package description is required"),
  packageWeight: z.string().optional(),
  packageDimensions: z.string().optional(),
  packageValue: z.string().optional(),
  specialInstructions: z.string().optional(),
});

type OrderForm = z.infer<typeof orderSchema>;

export default function CustomerPlaceOrderPage() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const { toast } = useToast();

  const form = useForm<OrderForm>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      pickupName: "",
      pickupPhone: "",
      pickupEmail: "",
      pickupAddress: "",
      pickupInstructions: "",
      deliveryName: "",
      deliveryPhone: "",
      deliveryEmail: "",
      deliveryAddress: "",
      deliveryInstructions: "",
      addressType: "street",
      orderPriority: "auto",
      jobType: "delivery",
      arrivalTime: "",
      timeAtStop: 5,
      packageDescription: "",
      packageWeight: "",
      packageDimensions: "",
      packageValue: "",
      specialInstructions: "",
    },
  });

  const watchAddressType = form.watch("addressType");
  const watchPickupAddress = form.watch("pickupAddress");
  const watchDeliveryAddress = form.watch("deliveryAddress");
  const watchOrderPriority = form.watch("orderPriority");
  const watchJobType = form.watch("jobType");

  // Calculate estimated cost based on addresses
  const calculateEstimate = async () => {
    if (watchPickupAddress && watchDeliveryAddress) {
      // Mock estimation logic - in production this would call pricing API
      const baseRate = 50; // ZAR base rate
      const distance = Math.random() * 20 + 5; // Mock distance 5-25km
      const estimated = baseRate + (distance * 2.5);
      setEstimatedCost(Math.round(estimated));
    }
  };

  const onSubmit = async (data: OrderForm) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/customer/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          estimatedCost: estimatedCost,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Order Placed Successfully!",
          description: `Order ${result.orderNumber} has been created. You'll receive updates via SMS and email.`,
        });
        setLocation("/customer/dashboard");
      } else {
        toast({
          title: "Order Failed",
          description: result.message || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/customer/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Place New Order</h1>
            <p className="text-gray-600">Fill in the details for your courier delivery</p>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2 text-blue-600" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pickup Contact */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 border-b pb-2">Pickup Contact</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pickupName">Name *</Label>
                    <Input
                      id="pickupName"
                      placeholder="John Doe"
                      {...form.register("pickupName")}
                    />
                    {form.formState.errors.pickupName && (
                      <p className="text-sm text-red-600">{form.formState.errors.pickupName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pickupPhone">Phone No *</Label>
                    <Input
                      id="pickupPhone"
                      placeholder="(000) 000-00-00"
                      {...form.register("pickupPhone")}
                    />
                    {form.formState.errors.pickupPhone && (
                      <p className="text-sm text-red-600">{form.formState.errors.pickupPhone.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickupEmail">Email</Label>
                  <Input
                    id="pickupEmail"
                    type="email"
                    placeholder="example@gmail.com"
                    {...form.register("pickupEmail")}
                  />
                  {form.formState.errors.pickupEmail && (
                    <p className="text-sm text-red-600">{form.formState.errors.pickupEmail.message}</p>
                  )}
                </div>
              </div>

              {/* Delivery Contact */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 border-b pb-2">Delivery Contact</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deliveryName">Name *</Label>
                    <Input
                      id="deliveryName"
                      placeholder="Jane Smith"
                      {...form.register("deliveryName")}
                    />
                    {form.formState.errors.deliveryName && (
                      <p className="text-sm text-red-600">{form.formState.errors.deliveryName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryPhone">Phone No *</Label>
                    <Input
                      id="deliveryPhone"
                      placeholder="(000) 000-00-00"
                      {...form.register("deliveryPhone")}
                    />
                    {form.formState.errors.deliveryPhone && (
                      <p className="text-sm text-red-600">{form.formState.errors.deliveryPhone.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryEmail">Email</Label>
                  <Input
                    id="deliveryEmail"
                    type="email"
                    placeholder="recipient@gmail.com"
                    {...form.register("deliveryEmail")}
                  />
                  {form.formState.errors.deliveryEmail && (
                    <p className="text-sm text-red-600">{form.formState.errors.deliveryEmail.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Addresses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-green-600" />
                Pickup & Delivery Addresses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Address Type Selection */}
              <div className="space-y-3">
                <Label>Address Type</Label>
                <RadioGroup
                  value={form.watch("addressType")}
                  onValueChange={(value) => form.setValue("addressType", value as "street" | "what3words")}
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="street" id="street" />
                    <Label htmlFor="street">Street Address</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="what3words" id="what3words" />
                    <Label htmlFor="what3words">what3words Address</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Pickup Address */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 border-b pb-2">Pick up from *</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="pickupAddress">Pick up address *</Label>
                  <div className="relative">
                    <Input
                      id="pickupAddress"
                      placeholder={
                        watchAddressType === "what3words" 
                          ? "///word.word.word" 
                          : "Enter a location"
                      }
                      {...form.register("pickupAddress")}
                      onBlur={calculateEstimate}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    >
                      <MapPin className="w-4 h-4" />
                    </Button>
                  </div>
                  {form.formState.errors.pickupAddress && (
                    <p className="text-sm text-red-600">{form.formState.errors.pickupAddress.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickupInstructions">Pickup Instructions</Label>
                  <Textarea
                    id="pickupInstructions"
                    placeholder="Additional pickup instructions..."
                    {...form.register("pickupInstructions")}
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 border-b pb-2">Delivery Address *</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                  <div className="relative">
                    <Input
                      id="deliveryAddress"
                      placeholder={
                        watchAddressType === "what3words" 
                          ? "///word.word.word" 
                          : "Enter a location"
                      }
                      {...form.register("deliveryAddress")}
                      onBlur={calculateEstimate}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    >
                      <MapPin className="w-4 h-4" />
                    </Button>
                  </div>
                  {form.formState.errors.deliveryAddress && (
                    <p className="text-sm text-red-600">{form.formState.errors.deliveryAddress.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryInstructions">Delivery Instructions</Label>
                  <Textarea
                    id="deliveryInstructions"
                    placeholder="Additional delivery instructions..."
                    {...form.register("deliveryInstructions")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scheduling - Circuit Style */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-yellow-600" />
                Job Scheduling & Priority
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Order Priority */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Order Priority</Label>
                <RadioGroup
                  value={watchOrderPriority}
                  onValueChange={(value) => form.setValue("orderPriority", value as "first" | "auto" | "last")}
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="first" id="priority-first" />
                    <Label htmlFor="priority-first" className="font-medium text-blue-600">First</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auto" id="priority-auto" />
                    <Label htmlFor="priority-auto" className="font-medium text-green-600">Auto</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="last" id="priority-last" />
                    <Label htmlFor="priority-last" className="font-medium text-gray-600">Last</Label>
                  </div>
                </RadioGroup>
                <p className="text-sm text-gray-600">First: High priority delivery. Auto: Smart optimization. Last: Flexible timing.</p>
              </div>

              {/* Job Type */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Job Type</Label>
                <RadioGroup
                  value={watchJobType}
                  onValueChange={(value) => form.setValue("jobType", value as "delivery" | "pickup")}
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="delivery" id="type-delivery" />
                    <Label htmlFor="type-delivery" className="font-medium text-purple-600">Delivery</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pickup" id="type-pickup" />
                    <Label htmlFor="type-pickup" className="font-medium text-orange-600">Pickup</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Timing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="arrivalTime">Arrival Time (optional)</Label>
                  <Input
                    id="arrivalTime"
                    type="time"
                    placeholder="HH:MM or leave blank for Anytime"
                    {...form.register("arrivalTime")}
                  />
                  <p className="text-xs text-gray-500">Specific time overrides priority order</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeAtStop">Time at Stop (minutes)</Label>
                  <Input
                    id="timeAtStop"
                    type="number"
                    min="1"
                    max="60"
                    {...form.register("timeAtStop", { valueAsNumber: true })}
                  />
                  <p className="text-xs text-gray-500">Estimated duration for pickup/delivery</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Package Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2 text-purple-600" />
                Package Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="packageDescription">Order Details *</Label>
                <Textarea
                  id="packageDescription"
                  placeholder="Describe what you're sending..."
                  {...form.register("packageDescription")}
                />
                {form.formState.errors.packageDescription && (
                  <p className="text-sm text-red-600">{form.formState.errors.packageDescription.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="packageWeight">Weight (optional)</Label>
                  <Input
                    id="packageWeight"
                    placeholder="2kg"
                    {...form.register("packageWeight")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="packageDimensions">Dimensions (optional)</Label>
                  <Input
                    id="packageDimensions"
                    placeholder="30x20x10cm"
                    {...form.register("packageDimensions")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="packageValue">Value (optional)</Label>
                  <Input
                    id="packageValue"
                    placeholder="R500"
                    {...form.register("packageValue")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialInstructions">Special Instructions</Label>
                <Textarea
                  id="specialInstructions"
                  placeholder="Any special handling requirements..."
                  {...form.register("specialInstructions")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cost Estimate */}
          {estimatedCost && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800">Estimated Cost</h3>
                      <p className="text-sm text-green-600">Based on distance and package details</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-800">R{estimatedCost}</p>
                    <p className="text-sm text-green-600">Final cost may vary</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="px-12 py-3 text-lg bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Placing Order..." : "Place Order"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}