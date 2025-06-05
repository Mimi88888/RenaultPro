import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Vehicle, Garage, Appointment } from "@shared/schema";
import { useLanguage } from "@/i18n/LanguageContext";
import { CalendarIcon, Car, MapPin, Clock, AlertCircle, Shield, CheckCircle, Wrench, ChevronRight, AlertTriangle, BatteryCharging, Gauge, Thermometer, Settings } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { format, addDays, isAfter, isBefore } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  // Récupérer les véhicules, rendez-vous et garages de l'utilisateur
  const { data: vehicles, isLoading: isLoadingVehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: appointments, isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: garages, isLoading: isLoadingGarages } = useQuery<Garage[]>({
    queryKey: ["/api/garages"],
  });

  // Obtenir le véhicule principal de l'utilisateur
  const primaryVehicle = vehicles?.find(v => v.isPrimary);
  
  // Obtenir le prochain rendez-vous
  const upcomingAppointments = appointments?.filter(a => 
    a.status !== "completed" && new Date(a.date) > new Date()
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const nextAppointment = upcomingAppointments?.[0];
  
  // Simuler l'état du véhicule (à remplacer par des données réelles)
  const vehicleHealth = {
    oil: 65,
    tires: 82,
    battery: 90,
    brakes: 75
  };
  
  // Simuler la date du prochain entretien (à remplacer par des données réelles)
  const nextServiceDue = primaryVehicle ? addDays(new Date(), 45) : null;
  const isServiceSoon = nextServiceDue && isBefore(nextServiceDue, addDays(new Date(), 14));
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      
      <main className="flex-1 p-4 pb-20 overflow-y-auto md:ml-64">
        {/* Bannière de bienvenue */}
        <div className="bg-primary/10 rounded-lg p-4 mb-6 border border-primary/20">
          <h1 className="text-2xl font-bold text-primary mb-1">
            {t.welcome}, {user?.fullName}
          </h1>
          <p className="text-muted-foreground">
            RenaultPro Tunisia - Your personal maintenance assistant
          </p>
        </div>
        
        {/* Section principale avec onglets */}
        <Tabs defaultValue="overview" className="mb-6">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">General View</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>
          
          {/* Onglet Vue Générale */}
          <TabsContent value="overview" className="space-y-4">
            {/* Carte de prochain rendez-vous */}
            <Card className="border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <CalendarIcon className="h-5 w-5 mr-2 text-blue-500" />
                  Next Appointment
                </CardTitle>
              </CardHeader>
              <CardContent>
                {nextAppointment ? (
                  <div className="flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{nextAppointment.serviceType}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(nextAppointment.date), "EEEE, d MMMM yyyy")} at {format(new Date(nextAppointment.date), "HH:mm")}
                        </p>
                      </div>
                      <Badge variant={nextAppointment.status === "urgent" ? "destructive" : "outline"}>
                        {nextAppointment.status === "urgent" ? "Urgent" : "Programmé"}
                      </Badge>
                    </div>
                    
                    <div className="text-sm bg-muted/50 p-2 rounded-md mt-1">
                      <p className="font-medium">{garages?.find(g => g.id === nextAppointment.garageId)?.name}</p>
                      <p className="text-muted-foreground text-xs">{garages?.find(g => g.id === nextAppointment.garageId)?.address}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-muted-foreground mb-3">No upcoming appointments</p>
                    <Button size="sm" onClick={() => navigate("/appointment")}>
                      Schedule an appointment
                    </Button>
                  </div>
                )}
              </CardContent>
              {nextAppointment && (
                <CardFooter className="pt-1">
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate("/appointment")}>
                    <span>Voir les détails</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              )}
            </Card>
            
            {/* Carte de santé du véhicule */}
            {primaryVehicle && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Gauge className="h-5 w-5 mr-2 text-green-500" />
                    État du Véhicule
                  </CardTitle>
                  <CardDescription>
                    {primaryVehicle.make} {primaryVehicle.model} ({primaryVehicle.year})
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Huile</span>
                      <span className="text-sm font-medium">{vehicleHealth.oil}%</span>
                    </div>
                    <Progress value={vehicleHealth.oil} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Pneus</span>
                      <span className="text-sm font-medium">{vehicleHealth.tires}%</span>
                    </div>
                    <Progress value={vehicleHealth.tires} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Batterie</span>
                      <span className="text-sm font-medium">{vehicleHealth.battery}%</span>
                    </div>
                    <Progress value={vehicleHealth.battery} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Freins</span>
                      <span className="text-sm font-medium">{vehicleHealth.brakes}%</span>
                    </div>
                    <Progress value={vehicleHealth.brakes} className="h-2" />
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  {nextServiceDue && (
                    <div className={`w-full text-sm flex items-center ${
                      isServiceSoon ? 'text-amber-600' : 'text-muted-foreground'
                    }`}>
                      {isServiceSoon ? (
                        <AlertTriangle className="h-4 w-4 mr-1" />
                      ) : (
                        <Clock className="h-4 w-4 mr-1" />
                      )}
                      Prochain entretien: {format(nextServiceDue, "d MMMM yyyy")}
                    </div>
                  )}
                </CardFooter>
              </Card>
            )}
            
            {/* Actions rapides */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => navigate("/appointment")}
              >
                <Clock className="h-5 w-5 mb-1" />
                <span>appointment</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => navigate("/map")}
              >
                <MapPin className="h-5 w-5 mb-1" />
                <span>Garages</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => navigate("/profile")}
              >
                <Car className="h-5 w-5 mb-1" />
                <span>Vehicles</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => navigate("/profile")}
              >
                <Wrench className="h-5 w-5 mb-1" />
                <span>History</span>
              </Button>
            </div>
          </TabsContent>
          
          {/* Onglet Véhicules */}
          <TabsContent value="vehicles" className="space-y-4">
            {isLoadingVehicles ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : vehicles && vehicles.length > 0 ? (
              <>
                {vehicles.map((vehicle) => (
                  <Card key={vehicle.id} className={vehicle.isPrimary ? "border-primary/30" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          {vehicle.make} {vehicle.model}
                        </CardTitle>
                        {vehicle.isPrimary && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            Principal
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        Année {vehicle.year} • {vehicle.licensePlate}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center">
                          <div className="bg-muted p-1.5 rounded-full mr-2">
                            <Gauge className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span>Kilométrage: {vehicle.nextServiceMileage || "N/A"}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="bg-muted p-1.5 rounded-full mr-2">
                            <BatteryCharging className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span>Batterie: {vehicleHealth.battery}%</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate("/profile")}>
                        Détails du véhicule
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
                <Button variant="outline" className="w-full" onClick={() => navigate("/profile")}>
                  <Car className="mr-2 h-4 w-4" />
                  Ajouter un véhicule
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="bg-muted inline-flex p-3 rounded-full mb-4">
                  <Car className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-2">No vehicles found</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Add your first vehicle to start tracking its maintenance
                </p>
                <Button onClick={() => navigate("/profile")}>
                Add your vehicle
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* Onglet Services */}
          <TabsContent value="services" className="space-y-4">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Card className="p-4 flex flex-col items-center text-center">
                <div className="bg-red-100 p-2 rounded-full mb-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <h3 className="text-sm font-medium mb-1">Urgent Assistance</h3>
                <p className="text-xs text-muted-foreground mb-3">Need immediate help?</p>
                <Button variant="destructive" size="sm" className="w-full" onClick={() => navigate("/appointment?emergency=true")}>
                 Request
                </Button>
              </Card>
              
              <Card className="p-4 flex flex-col items-center text-center">
                <div className="bg-blue-100 p-2 rounded-full mb-2">
                  <Wrench className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="text-sm font-medium mb-1">Standard Revision</h3>
                <p className="text-xs text-muted-foreground mb-3">Periodic maintenance</p>
                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/appointment")}>
                  Book
                </Button>
              </Card>
            </div>
            
            <h3 className="font-medium text-lg mb-3">Available Services</h3>
            <div className="space-y-2.5">
              {[
                { icon: <Thermometer className="h-4 w-4" />, name: "Air Conditioning", desc: "Diagnosis and recharge" },
                { icon: <Shield className="h-4 w-4" />, name: "Warranty", desc: "Warranty services" },
                { icon: <Wrench className="h-4 w-4" />, name: "Mechanics", desc: "Advanced repairs" },
                { icon: <CheckCircle className="h-4 w-4" />, name: "Diagnosis", desc: "Comprehensive analysis" }
              ].map((service, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                  <div className="flex items-center">
                    <div className="bg-muted p-2 rounded-full mr-3">
                      {service.icon}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{service.name}</p>
                      <p className="text-muted-foreground text-xs">{service.desc}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => navigate("/appointment")}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <BottomNavigation />
    </div>
  );
}