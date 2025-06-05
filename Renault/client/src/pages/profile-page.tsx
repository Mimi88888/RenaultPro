import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Vehicle, Appointment } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, ChevronRight, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Vehicle form schema
const vehicleSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce.number().int().min(1900, "Invalid year").max(new Date().getFullYear() + 1, "Invalid year"),
  licensePlate: z.string().min(1, "License plate is required"),
  vin: z.string().min(17, "VIN must be exactly 17 characters").max(17, "VIN must be exactly 17 characters"),
  chipsetCode: z.string().min(6, "Chipset code is required (min 6 characters)").max(10, "Chipset code too long"),
  fuelType: z.string().min(1, "Fuel type is required"),
  isPrimary: z.boolean().default(false),
  status: z.string().default("Good"),
  nextServiceMileage: z.coerce.number().int().optional(),
  // Nouveaux champs pour véhicules importés
  isImported: z.boolean().default(false),
  importCountry: z.string().optional(),
  requiresOtpVerification: z.boolean().default(false),
  otpVerified: z.boolean().default(false),
  purchaseDate: z.date().optional(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  
  // Fetch user vehicles
  const { data: vehicles, isLoading: isLoadingVehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });
  
  // Fetch user appointments for service history
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });
  
  // Vehicle form
  const vehicleForm = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      make: "Renault",
      model: "",
      year: new Date().getFullYear(),
      licensePlate: "",
      vin: "",
      chipsetCode: "",
      fuelType: "Gasoline",
      isPrimary: false,
      status: "Good",
      nextServiceMileage: 5000,
      isImported: false,
      requiresOtpVerification: false,
      otpVerified: false,
    },
  });
  
  // Add vehicle mutation
  const addVehicleMutation = useMutation({
    mutationFn: async (data: VehicleFormValues) => {
      const response = await apiRequest("POST", "/api/vehicles", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: "Vehicle added",
        description: "Your vehicle has been added successfully",
      });
      setIsAddingVehicle(false);
      vehicleForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add vehicle",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Set vehicle as primary
  const setPrimaryMutation = useMutation({
    mutationFn: async (vehicleId: number) => {
      const response = await apiRequest("PATCH", `/api/vehicles/${vehicleId}`, { isPrimary: true });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: "Default vehicle updated",
        description: "Your primary vehicle has been updated",
      });
    },
  });
  
  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Handle add vehicle form submission
  const onSubmitVehicle = (data: VehicleFormValues) => {
    addVehicleMutation.mutate(data);
  };
  
  // Handle setting a vehicle as primary
  const handleSetPrimary = (vehicle: Vehicle) => {
    if (!vehicle.isPrimary) {
      setPrimaryMutation.mutate(vehicle.id);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      
      <main className="flex-1 p-4 pb-20 overflow-y-auto md:ml-64">
        <div className="p-4">
          {/* User Profile Card */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl font-bold">
                  {user?.fullName.charAt(0)}
                </div>
                <div className="ml-4">
                  <h2 className="font-semibold text-lg">{user?.fullName}</h2>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <div className="flex items-center mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span className="text-sm ml-1">Verified Account</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Vehicles Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-lg">Your Vehicles</h2>
              <Dialog open={isAddingVehicle} onOpenChange={setIsAddingVehicle}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="text-primary font-medium flex items-center">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Car
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Vehicle</DialogTitle>
                  </DialogHeader>
                  
                  <Form {...vehicleForm}>
                    <form onSubmit={vehicleForm.handleSubmit(onSubmitVehicle)} className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={vehicleForm.control}
                          name="make"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Make</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Toyota" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={vehicleForm.control}
                          name="model"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Model</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Camry" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={vehicleForm.control}
                          name="year"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Year</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={vehicleForm.control}
                          name="fuelType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fuel Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select fuel type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Gasoline">Gasoline</SelectItem>
                                  <SelectItem value="Diesel">Diesel</SelectItem>
                                  <SelectItem value="Electric">Electric</SelectItem>
                                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={vehicleForm.control}
                        name="licensePlate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>License Plate</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. ABC-1234" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={vehicleForm.control}
                        name="vin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Version</FormLabel>
                            <FormControl>
                              <Input placeholder="Version" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={vehicleForm.control}
                        name="chipsetCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>The chassis of a vehicle</FormLabel>
                            <FormControl>
                              <Input placeholder="The chassis of a vehicle" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={vehicleForm.control}
                        name="isImported"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg space-y-0">
                            <div className="space-y-0.5">
                              <FormLabel>Véhicule Importé</FormLabel>
                              <FormDescription className="text-xs">
                                Ce véhicule a-t-il été acheté en dehors de la Tunisie?
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  vehicleForm.setValue("requiresOtpVerification", checked);
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {vehicleForm.watch("isImported") && (
                        <FormField
                          control={vehicleForm.control}
                          name="importCountry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pays d'origine</FormLabel>
                              <FormControl>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Sélectionner le pays d'origine" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="France">France</SelectItem>
                                    <SelectItem value="Italy">Italie</SelectItem>
                                    <SelectItem value="Germany">Allemagne</SelectItem>
                                    <SelectItem value="Spain">Espagne</SelectItem>
                                    <SelectItem value="Other">Autre</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      {vehicleForm.watch("isImported") && (
                        <FormField
                          control={vehicleForm.control}
                          name="requiresOtpVerification"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg space-y-0">
                              <div className="space-y-0.5">
                                <FormLabel>Vérification OTP</FormLabel>
                                <FormDescription className="text-xs">
                                  Activer la vérification supplémentaire par OTP pour ce véhicule importé.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                      
                      <FormField
                        control={vehicleForm.control}
                        name="nextServiceMileage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Next Service (miles)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={vehicleForm.control}
                        name="isPrimary"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                            <FormControl>
                              <input 
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="form-checkbox"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Set as primary vehicle</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end pt-4">
                        <Button 
                          type="submit" 
                          disabled={addVehicleMutation.isPending}
                        >
                          {addVehicleMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            "Add Vehicle"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            
            {isLoadingVehicles ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : vehicles && vehicles.length > 0 ? (
              <div className="space-y-3">
                {vehicles.map((vehicle) => (
                  <Card 
                    key={vehicle.id} 
                    className={`border-2 ${vehicle.isPrimary ? 'border-primary' : 'border-transparent'}`}
                    onClick={() => handleSetPrimary(vehicle)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{vehicle.make} {vehicle.model}</h3>
                          <p className="text-sm text-muted-foreground">{vehicle.year} • {vehicle.fuelType}</p>
                        </div>
                        {vehicle.isPrimary && (
                          <div className="bg-primary/10 px-3 py-1 rounded-md">
                            <span className="text-primary text-xs font-medium">Primary</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">License:</span>
                            <span className="font-medium ml-1">{vehicle.licensePlate}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">VIN:</span>
                            <span className="font-medium ml-1">{vehicle.vin.substring(0, 8)}****</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Chipset OTP:</span>
                            <span className="font-medium ml-1 text-blue-600">{vehicle.chipsetCode && `${vehicle.chipsetCode.substring(0, 2)}****${vehicle.chipsetCode.substring(vehicle.chipsetCode.length - 2)}`}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Status:</span>
                            <span className={`font-medium ml-1 ${
                              vehicle.status === "Good" ? "text-green-600" : 
                              vehicle.status === "Service Due" ? "text-amber-600" : "text-red-600"
                            }`}>{vehicle.status}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Next Service:</span>
                            <span className="font-medium ml-1">
                              {vehicle.nextServiceMileage ? `${vehicle.nextServiceMileage.toLocaleString()} mi` : "Not set"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end mt-3">
                        <Button variant="ghost" size="sm" className="text-primary">Manage</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">No vehicles added yet</p>
                  <Button onClick={() => setIsAddingVehicle(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Vehicle
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Service History */}
          <div className="mb-6">
            <h2 className="font-semibold text-lg mb-3">Service History</h2>
            
            {isLoadingAppointments ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : appointments && appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <Card key={appointment.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">{appointment.serviceType}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(appointment.date).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="text-sm mb-2">
                        <span className="text-muted-foreground">Vehicle ID: {appointment.vehicleId}</span>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <span>Garage ID: {appointment.garageId}</span>
                        {appointment.price && (
                          <>
                            <span> · </span>
                            <span>${appointment.price.toFixed(2)}</span>
                          </>
                        )}
                      </div>
                      
                      <div className="mt-3 pt-2 border-t border-border flex justify-between items-center">
                        <span className="text-sm px-2 py-1 bg-green-100 text-green-800 rounded">{appointment.status}</span>
                        <Button variant="ghost" size="sm" className="text-primary">Details</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">No service history available</p>
                  <Button onClick={() => navigate("/appointment")}>
                    Book Service
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Account Settings */}
          <div className="mb-6">
            <h2 className="font-semibold text-lg mb-3">Account Settings</h2>
            <Card>
              <CardContent className="p-0">
                <Button 
                  variant="ghost" 
                  className="w-full justify-between p-4 h-auto rounded-none border-b"
                  onClick={() => navigate("/settings")}
                >
                  <div className="flex items-center">
                    <span className="mr-3 text-muted-foreground">👤</span>
                    <span>Personal Information</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-between p-4 h-auto rounded-none border-b"
                  onClick={() => navigate("/settings?tab=notifications")}
                >
                  <div className="flex items-center">
                    <span className="mr-3 text-muted-foreground">🔔</span>
                    <span>Notifications</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-between p-4 h-auto rounded-none border-b"
                  onClick={() => navigate("/settings?tab=payment")}
                >
                  <div className="flex items-center">
                    <span className="mr-3 text-muted-foreground">💳</span>
                    <span>Payment Methods</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-between p-4 h-auto rounded-none border-b"
                  onClick={() => navigate("/settings?tab=security")}
                >
                  <div className="flex items-center">
                    <span className="mr-3 text-muted-foreground">🔒</span>
                    <span>Security</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-between p-4 h-auto rounded-none"
                  onClick={() => navigate("/settings?tab=help")}
                >
                  <div className="flex items-center">
                    <span className="mr-3 text-muted-foreground">❓</span>
                    <span>Help & Support</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Logout Button */}
          <Button 
            variant="outline" 
            className="w-full py-3 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 mb-6"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}
