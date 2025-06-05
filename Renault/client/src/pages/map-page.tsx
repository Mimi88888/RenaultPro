import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Map } from "@/components/ui/map";
import { Garage } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Loader2, MapPin, Phone, Navigation, Star, Filter } from "lucide-react";

export default function MapPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("nearby");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [distanceFilter, setDistanceFilter] = useState(15);
  const bottomSheetRef = useRef<HTMLDivElement>(null);

  // Get all garages
  const { data: allGarages, isLoading } = useQuery<Garage[]>({
    queryKey: ["/api/garages"],
  });

  // Get nearby garages if location is available
  const { data: nearbyGarages, isLoading: isLoadingNearby } = useQuery<Garage[]>({
    queryKey: ["/api/garages/nearby", location?.[0], location?.[1], distanceFilter],
    queryFn: async () => {
      if (!location) return [];
      const [lat, lng] = location;
      const res = await fetch(`/api/garages/nearby?lat=${lat}&lng=${lng}&radius=${distanceFilter}`);
      if (!res.ok) throw new Error("Failed to fetch nearby garages");
      return res.json();
    },
    enabled: !!location,
  });
  
  // Handle marker click on map
  const handleMarkerClick = (garage: Garage) => {
    setSelectedGarage(garage);
    
    // Scroll to the matching garage in the list
    if (bottomSheetRef.current) {
      const garageElement = document.getElementById(`garage-${garage.id}`);
      if (garageElement) {
        bottomSheetRef.current.scrollTo({
          top: garageElement.offsetTop - 100,
          behavior: "smooth"
        });
      }
    }
  };
  
  // Handle location update
  const handleLocationUpdate = (lat: number, lng: number) => {
    setLocation([lat, lng]);
  };
  
  // Get displayed garages based on active tab
  const displayedGarages = activeTab === "nearby" ? (nearbyGarages || allGarages || []) : 
    allGarages?.filter(garage => garage.isFavorite) || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      
      <main className="flex-1 p-0 pb-20 md:ml-64">
        {/* Map Container - Takes full width and height with proper sidebar spacing */}
        <div className="absolute inset-0 md:left-64 z-0">
          <Map 
            garages={allGarages} 
            onMarkerClick={handleMarkerClick}
            onMyLocationClick={handleLocationUpdate}
            className="h-[70vh]"
          />
        </div>
        
        {/* Bottom Sheet - Also adjusted to respect the sidebar width */}
        <div 
          ref={bottomSheetRef}
          className="absolute bottom-0 left-0 right-0 md:left-64 bg-background rounded-t-xl shadow-lg max-h-[60vh] overflow-y-auto z-10"
        >
          {/* Tab Header and Content */}
          <div className="px-4 pt-4 pb-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-between items-center sticky top-0 bg-background z-10">
                <TabsList>
                  <TabsTrigger value="nearby">Nearby</TabsTrigger>
                  <TabsTrigger value="favorites">Favorites</TabsTrigger>
                </TabsList>
                
                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Filter className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[60vh]">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    
                    <div className="filter-container" style={{ height: '300px', overflowY: 'auto' }}>
                      <div className="py-4 space-y-6">
                        {/* Service Type Filter */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">Service Type</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {["Oil Change", "Tire Service", "Brakes", "Electrical", "Engine Repair", "A/C Service"].map((service) => (
                              <div key={service} className="flex items-center space-x-2">
                                <Checkbox id={`filter-${service.toLowerCase().replace(/\s/g, '-')}`} />
                                <Label htmlFor={`filter-${service.toLowerCase().replace(/\s/g, '-')}`} className="text-sm">
                                  {service}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Availability Filter */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">Availability</h4>
                          <RadioGroup defaultValue="open-now">
                            {[
                              { id: "open-now", label: "Open now" },
                              { id: "today", label: "Available today" },
                              { id: "tomorrow", label: "Available tomorrow" },
                              { id: "week", label: "Available this week" }
                            ].map((option) => (
                              <div key={option.id} className="flex items-center space-x-2">
                                <RadioGroupItem value={option.id} id={option.id} />
                                <Label htmlFor={option.id} className="text-sm">
                                  {option.label}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                        
                        {/* Distance Filter */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">Distance</h4>
                          <Slider
                            defaultValue={[distanceFilter]}
                            max={50}
                            min={1}
                            step={1}
                            onValueChange={(values) => setDistanceFilter(values[0])}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>1 mile</span>
                            <span>{distanceFilter} miles</span>
                            <span>50 miles</span>
                          </div>
                        </div>
                        
                        {/* Rating Filter */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">Rating</h4>
                          <RadioGroup defaultValue="any">
                            {[
                              { id: "any", label: "Any rating" },
                              { id: "4plus", label: "4.0+ stars" },
                              { id: "45plus", label: "4.5+ stars" }
                            ].map((option) => (
                              <div key={option.id} className="flex items-center space-x-2">
                                <RadioGroupItem value={option.id} id={option.id} />
                                <Label htmlFor={option.id} className="text-sm">
                                  {option.label}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                        
                        {/* Filter Actions */}
                        <div className="flex gap-3 pt-4">
                          <Button variant="outline" className="flex-1">Reset</Button>
                          <Button className="flex-1" onClick={() => setIsFilterOpen(false)}>
                            Apply Filters
                          </Button>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              
              <div className="h-px bg-border my-4"></div>
              
              {/* Tab Content */}
              <TabsContent value="nearby" className="px-0 pb-20 mt-0">
                {isLoading || isLoadingNearby ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : displayedGarages?.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No garages found nearby</p>
                    <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters or location</p>
                    <Button onClick={() => setDistanceFilter(50)}>Increase Search Radius</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayedGarages?.map((garage) => (
                      <Card 
                        key={garage.id} 
                        id={`garage-${garage.id}`}
                        className={`border ${selectedGarage?.id === garage.id ? 'border-primary' : 'border-border'}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium text-lg">{garage.name}</h3>
                              <div className="flex items-center text-sm">
                                <div className="flex items-center text-amber-500">
                                  <Star className="h-4 w-4 fill-amber-500" />
                                  <span className="ml-1">{garage.rating}</span>
                                </div>
                                {garage.reviewCount && (
                                  <>
                                    <span className="mx-2">·</span>
                                    <span>{garage.reviewCount} reviews</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              2.3 mi
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            {garage.services.slice(0, 3).map((service, idx) => (
                              <span key={idx} className="text-xs px-2 py-1 bg-secondary rounded-full">
                                {service}
                              </span>
                            ))}
                          </div>
                          
                          <div className="text-sm mb-3 flex items-center">
                            <span className={`inline-block w-2 h-2 rounded-full ${garage.isOpen ? 'bg-green-500' : 'bg-amber-500'} mr-1`}></span>
                            <span className={garage.isOpen ? 'text-green-600' : 'text-amber-600'}>
                              {garage.isOpen ? 'Open now' : 'Closed'}
                            </span>
                            {garage.isOpen && (
                              <>
                                <span className="mx-2">·</span>
                                <span>Until {garage.closingHour > 12 ? `${garage.closingHour - 12} PM` : `${garage.closingHour} AM`}</span>
                              </>
                            )}
                          </div>
                          
                          <div className="text-sm text-muted-foreground mb-4">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{garage.address}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              className="flex-1"
                              onClick={() => navigate(`/appointment?garageId=${garage.id}`)}
                            >
                              Book Now
                            </Button>
                            <Button variant="outline" size="icon">
                              <Navigation className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon">
                              <Phone className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="favorites" className="px-0 pb-20 mt-0">
                {displayedGarages?.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No favorite garages yet</p>
                    <Button 
                      className="mt-4"
                      onClick={() => setActiveTab("nearby")}
                    >
                      Browse Nearby Garages
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayedGarages?.map((garage) => (
                      <Card key={garage.id}>
                        <CardContent className="p-4">
                          {/* Same garage card content as above */}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Emergency Button - Adjusted for desktop */}
        <Button 
          className="absolute right-4 bottom-32 md:right-8 bg-red-600 hover:bg-red-700 text-white rounded-full p-3 h-12 w-12 shadow-lg"
          onClick={() => navigate("/appointment?emergency=true")}
        >
          <span className="text-sm font-bold">SOS</span>
        </Button>
      </main>
      
      <BottomNavigation />
    </div>
  );
}
