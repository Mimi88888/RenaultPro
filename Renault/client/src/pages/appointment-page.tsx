import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {Input} from "@/components/ui/input"; 
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Vehicle, Garage, InsertAppointment } from "@shared/schema";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format, addDays, startOfDay, getHours, getMinutes, setHours, setMinutes, addMinutes } from "date-fns";
import { CalendarIcon, Loader2, Clock, CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Form schema
const appointmentSchema = z.object({
  garageId: z.coerce.number().int().positive("Please select a garage"),
  vehicleId: z.coerce.number().int().positive("Please select a vehicle"),
  serviceType: z.string().min(1, "Please select a service type"),
  date: z.date({
    required_error: "Please select a date",
  }).refine(date => date > new Date(), {
    message: "Appointment must be in the future",
  }),
  timeSlot: z.string().min(1, "Please select a time slot"),
  notes: z.string().optional(),
  isEmergency: z.boolean().default(false),
  paymentMethod: z.enum(["cash", "card", "transfer", "later"], {
    required_error: "Please select a payment method",
  }),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

export default function AppointmentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Parse URL params
  const params = new URLSearchParams(location.search);
  const garageIdParam = params.get("garageId") ? parseInt(params.get("garageId")!) : undefined;
  const isEmergencyParam = params.get("emergency") === "true";

  // Get user vehicles
  const { data: vehicles, isLoading: isLoadingVehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  // Get available garages
  const { data: garages, isLoading: isLoadingGarages } = useQuery<Garage[]>({
    queryKey: ["/api/garages"],
  });

  // Placeholder for unavailable dates (replace with actual API call)
  const unavailableDates = [new Date(), addDays(new Date(), 2)]; //Example

  // Function to check if a date is unavailable
  const isDateUnavailable = (date: Date) => {
    return unavailableDates.some(unavailableDate => 
      startOfDay(date).getTime() === startOfDay(unavailableDate).getTime()
    );
  };


  // Initialize form with default values
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      garageId: garageIdParam || 0,
      vehicleId: 0,
      serviceType: "",
      date: addDays(new Date(), 1),
      timeSlot: "",
      notes: "",
      isEmergency: isEmergencyParam,
      paymentMethod: "cash",
    },
  });

  // Update form values when params change
  useEffect(() => {
    if (garageIdParam) {
      form.setValue("garageId", garageIdParam);
    }
    if (isEmergencyParam) {
      form.setValue("isEmergency", true);
    }
  }, [garageIdParam, isEmergencyParam, form]);

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormValues) => {
      // Parse the time slot and set the appointment date to the selected time
      const [hours, minutes] = data.timeSlot.split(":").map(Number);
      const appointmentDate = setMinutes(setHours(data.date, hours), minutes);

      // Note: userId will be added by the server from the authenticated session
      // Convertir en objet avec des propriétés sans problème de typage
      const appointmentData = {
        garageId: data.garageId,
        vehicleId: data.vehicleId,
        serviceType: data.serviceType,
        date: appointmentDate.toISOString(), // Convertir en chaîne ISO pour la sérialisation JSON
        status: data.isEmergency ? "urgent" : "scheduled",
        notes: data.notes,
        paymentMethod: data.paymentMethod,
        paymentStatus: "pending", // Par défaut, le paiement est en attente
      };

      const response = await apiRequest("POST", "/api/appointments", appointmentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setIsSuccess(true);
      setIsSubmitting(false);
      window.scrollTo(0, 0);
    },
    onError: (error: Error) => {
      console.error("Appointment error:", error);
      // Log the response body as well if available
      if ((error as any).response) {
        (error as any).response.json().then((data: any) => {
          console.error("Error details:", data);
        }).catch(() => {
          // Ignore any error in parsing json
        });
      }
      
      toast({
        title: "Failed to book appointment",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Handle form submission
  const onSubmit = (data: AppointmentFormValues) => {
    setIsSubmitting(true);
    createAppointmentMutation.mutate(data);
  };

  // Generate time slots for the selected date
  const generateTimeSlots = () => {
    const slots = [];
    const selectedDate = form.getValues("date");
    const isToday = startOfDay(selectedDate).getTime() === startOfDay(new Date()).getTime();

    // Start time (8 AM or current time if today, rounded up to next 30 min)
    let startHour = 8;
    let startMinute = 0;

    if (isToday) {
      const now = new Date();
      startHour = getHours(now);
      startMinute = getMinutes(now);

      // Round up to next 30 minute slot
      if (startMinute > 0 && startMinute <= 30) {
        startMinute = 30;
      } else if (startMinute > 30) {
        startHour += 1;
        startMinute = 0;
      }
    }

    // Generate slots every 30 minutes from start time to 6 PM
    let time = setMinutes(setHours(new Date(), startHour), startMinute);
    const endTime = setHours(new Date(), 18); // 6 PM

    while (time <= endTime) {
      const formattedTime = `${getHours(time)}:${getMinutes(time) === 0 ? '00' : getMinutes(time)}`;
      const displayTime = format(time, "h:mm a");
      slots.push({ value: formattedTime, label: displayTime });
      time = addMinutes(time, 30);
    }

    return slots;
  };

  // Get available service types based on selected garage
  const getAvailableServices = () => {
    const selectedGarageId = form.getValues("garageId");
    const selectedGarage = garages?.find(garage => garage.id === selectedGarageId);
    return selectedGarage?.services || [];
  };

  // Render different views based on the booking progress
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 flex flex-col items-center justify-center min-h-full">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-xl">Appointment Confirmed!</CardTitle>
              </CardHeader>

              <CardContent className="text-center space-y-4">
                <p>Your appointment has been successfully booked.</p>

                <div className="rounded-lg bg-muted p-4">
                  <div className="mb-2">
                    <p className="font-medium">{form.getValues("serviceType")}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(form.getValues("date"), "EEEE, MMMM d, yyyy")} at {form.getValues("timeSlot").split(":").map((n, i) => i === 0 ? parseInt(n) : n).join(":")}
                      {parseInt(form.getValues("timeSlot").split(":")[0]) >= 12 ? " PM" : " AM"}
                    </p>
                  </div>

                  <div className="text-sm">
                    <p>
                      {garages?.find(g => g.id === form.getValues("garageId"))?.name}
                    </p>
                    <p className="text-muted-foreground">
                      {garages?.find(g => g.id === form.getValues("garageId"))?.address}
                    </p>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-border text-sm">
                    <div className="flex justify-between">
                      <span>Payment Method:</span>
                      <span className="font-medium capitalize">{form.getValues("paymentMethod")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Status:</span>
                      <span className="text-amber-600 font-medium">Pending</span>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex gap-2 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/")}
                >
                  Back to Home
                </Button>
                <Button onClick={() => navigate("/map")}>
                  View on Map
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>

        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="flex-1 p-4 pb-20 overflow-y-auto md:ml-64">
        <div className="p-4">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-2"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Book Appointment</h1>
          </div>

          {/* Emergency Notice */}
          {form.getValues("isEmergency") && (
            <Card className="mb-6 border-red-500 bg-red-50">
              <CardContent className="p-4 flex items-center">
                <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
                <div>
                  <h3 className="font-medium text-red-700">Emergency Service</h3>
                  <p className="text-sm text-red-600">We'll prioritize your request and contact you immediately.</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Select Vehicle */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Vehicle</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingVehicles ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : vehicles && vehicles.length > 0 ? (
                    <FormField
                      control={form.control}
                      name="vehicleId"
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a vehicle" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {vehicles.map((vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                                  {vehicle.make} {vehicle.model} ({vehicle.year})
                                  {vehicle.isPrimary && " - Primary"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-2">No vehicles found</p>
                      <Button onClick={() => navigate("/profile")} variant="outline" size="sm">
                        Add a Vehicle
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Select Garage */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Garage</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingGarages ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : garages && garages.length > 0 ? (
                    <FormField
                      control={form.control}
                      name="garageId"
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value.toString() || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a garage" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {garages.map((garage) => (
                                <SelectItem key={garage.id} value={garage.id.toString()}>
                                  {garage.name} - {garage.isOpen ? "Open" : "Closed"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No garages found</p>
                    </div>
                  )}

                  {form.getValues("garageId") > 0 && garages && (
                    <div className="mt-4 text-sm">
                      <div className="font-medium">
                        {garages.find(g => g.id === form.getValues("garageId"))?.name}
                      </div>
                      <div className="text-muted-foreground">
                        {garages.find(g => g.id === form.getValues("garageId"))?.address}
                      </div>
                      <div className="flex items-center mt-1">
                        <span className={`inline-block w-2 h-2 rounded-full ${
                          garages.find(g => g.id === form.getValues("garageId"))?.isOpen 
                            ? 'bg-green-500' 
                            : 'bg-amber-500'
                        } mr-1`}></span>
                        <span className={garages.find(g => g.id === form.getValues("garageId"))?.isOpen 
                          ? 'text-green-600' 
                          : 'text-amber-600'
                        }>
                          {garages.find(g => g.id === form.getValues("garageId"))?.isOpen ? 'Open now' : 'Closed'}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Service Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Service Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="serviceType"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={form.getValues("garageId") === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select service type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getAvailableServices().map((service, index) => (
                              <SelectItem key={index} value={service}>
                                {service}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Date and Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Date & Time</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => isDateUnavailable(date) || date < new Date() || date > addDays(new Date(), 30)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timeSlot"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a time slot" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {generateTimeSlots().map((slot) => (
                              <SelectItem key={slot.value} value={slot.value}>
                                {slot.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Additional Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Describe any specific issues or requirements..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Emergency Toggle */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Service Priority</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="isEmergency"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(value === "emergency")}
                            defaultValue={field.value ? "emergency" : "standard"}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="standard" id="standard" />
                              <Label htmlFor="standard" className="font-normal">Standard Service</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="emergency" id="emergency" />
                              <Label htmlFor="emergency" className="font-normal">Emergency Service (Priority)</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          Emergency service may incur additional fees but will be prioritized by the garage.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="cash" id="cash" />
                              <Label htmlFor="cash" className="font-normal">Cash</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="card" id="card" />
                              <Label htmlFor="card" className="font-normal">Credit/Debit Card</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="transfer" id="transfer" />
                              <Label htmlFor="transfer" className="font-normal">Bank Transfer</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="later" id="later" />
                              <Label htmlFor="later" className="font-normal">Pay Later (at the garage)</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          Select your preferred payment method. For card payments, you'll be redirected to secure payment page after booking.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Booking Appointment...
                  </>
                ) : (
                  "Book Appointment"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}