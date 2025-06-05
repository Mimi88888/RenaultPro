import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, Bell, CreditCard, Lock, HelpCircle, LogOut, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

// Personal info form schema
const personalInfoSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
});

// Notifications form schema
const notificationsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  appointmentReminders: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
  serviceUpdates: z.boolean().default(true),
});

// Security form schema
const securitySchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Theme form schema
const themeSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).default("system"),
  distanceUnit: z.enum(["miles", "kilometers"]).default("miles"),
  language: z.enum(["english", "french", "arabic"]).default("english"),
});

// Payment card form schema
const paymentCardSchema = z.object({
  cardNumber: z.string()
    .min(13, "Card number must be at least 13 digits")
    .max(19, "Card number must not exceed 19 digits")
    .regex(/^\d+$/, "Card number must contain only digits"),
  expirationDate: z.string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Expiration date must be in format MM/YY"),
  cvv: z.string()
    .length(3, "CVV must be 3 digits")
    .regex(/^\d+$/, "CVV must contain only digits"),
  cardholderName: z.string().min(2, "Cardholder name is required"),
});

type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;
type NotificationsFormValues = z.infer<typeof notificationsSchema>;
type SecurityFormValues = z.infer<typeof securitySchema>;
type ThemeFormValues = z.infer<typeof themeSchema>;
type PaymentCardFormValues = z.infer<typeof paymentCardSchema>;

export default function SettingsPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse URL params to determine active tab
  const params = new URLSearchParams(location.search);
  const tabParam = params.get("tab");
  const [activeTab, setActiveTab] = useState<string>(
    tabParam || "personal"
  );
  
  // Payment card form
  const paymentCardForm = useForm<PaymentCardFormValues>({
    resolver: zodResolver(paymentCardSchema),
    defaultValues: {
      cardNumber: "",
      expirationDate: "",
      cvv: "",
      cardholderName: "",
    },
  });
  
  // State for dialogs
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isPayPalDialogOpen, setIsPayPalDialogOpen] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  
  // Personal info form
  const personalInfoForm = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phoneNumber || "",
    },
  });
  
  // Notifications form
  const notificationsForm = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      emailNotifications: true,
      pushNotifications: true,
      appointmentReminders: true,
      marketingEmails: false,
      serviceUpdates: true,
    },
  });
  
  // Security form
  const securityForm = useForm<SecurityFormValues>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Theme form
  const themeForm = useForm<ThemeFormValues>({
    resolver: zodResolver(themeSchema),
    defaultValues: {
      theme: "system",
      distanceUnit: "miles",
      language: (language as "english" | "french" | "arabic") || "english",
    },
  });
  
  // Update form when language changes from context
  useEffect(() => {
    themeForm.setValue("language", language as "english" | "french" | "arabic");
  }, [language, themeForm]);
  
  // Handle tab change and update URL
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/settings?tab=${value}`, { replace: true });
  };
  
  // Form submission handlers
  const onPersonalInfoSubmit = (values: PersonalInfoFormValues) => {
    toast({
      title: "Profile updated",
      description: "Your personal information has been updated.",
    });
  };
  
  const onNotificationsSubmit = (values: NotificationsFormValues) => {
    toast({
      title: "Notification preferences updated",
      description: "Your notification settings have been saved.",
    });
  };
  
  const onSecuritySubmit = (values: SecurityFormValues) => {
    toast({
      title: "Password updated",
      description: "Your password has been changed successfully.",
    });
    securityForm.reset();
  };
  
  const onThemeSubmit = (values: ThemeFormValues) => {
    // Update language in the context
    if (values.language !== language) {
      setLanguage(values.language);
    }
    
    toast({
      title: "Preferences updated",
      description: "Your app preferences have been saved.",
    });
  };
  
  // Handle payment card form submission
  const onPaymentCardSubmit = (values: PaymentCardFormValues) => {
    setIsAddingCard(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      setIsAddingCard(false);
      setIsAddCardOpen(false);
      
      toast({
        title: "Card added successfully",
        description: `Card ending in ${values.cardNumber.slice(-4)} has been added to your account.`,
      });
      
      paymentCardForm.reset();
    }, 1500);
  };
  
  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/auth");
  };

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
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
          
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid grid-cols-5 mb-6">
              <TabsTrigger value="personal" className="flex flex-col items-center py-2 px-0">
                <User className="h-4 w-4 mb-1" />
                <span className="text-xs">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex flex-col items-center py-2 px-0">
                <Bell className="h-4 w-4 mb-1" />
                <span className="text-xs">Alerts</span>
              </TabsTrigger>
              <TabsTrigger value="payment" className="flex flex-col items-center py-2 px-0">
                <CreditCard className="h-4 w-4 mb-1" />
                <span className="text-xs">Payment</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex flex-col items-center py-2 px-0">
                <Lock className="h-4 w-4 mb-1" />
                <span className="text-xs">Security</span>
              </TabsTrigger>
              <TabsTrigger value="help" className="flex flex-col items-center py-2 px-0">
                <HelpCircle className="h-4 w-4 mb-1" />
                <span className="text-xs">Help</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Personal Information Tab */}
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your account information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...personalInfoForm}>
                    <form onSubmit={personalInfoForm.handleSubmit(onPersonalInfoSubmit)} className="space-y-4">
                      <FormField
                        control={personalInfoForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={personalInfoForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={personalInfoForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input type="tel" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full">
                        Save Changes
                      </Button>
                    </form>
                  </Form>
                  
                  <Separator className="my-6" />
                  
                  <h3 className="text-lg font-medium mb-4">App Preferences</h3>
                  <Form {...themeForm}>
                    <form onSubmit={themeForm.handleSubmit(onThemeSubmit)} className="space-y-4">
                      <FormField
                        control={themeForm.control}
                        name="theme"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Theme</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col space-y-1"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="light" id="light" />
                                  <Label htmlFor="light">Light</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="dark" id="dark" />
                                  <Label htmlFor="dark">Dark</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="system" id="system" />
                                  <Label htmlFor="system">System Default</Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={themeForm.control}
                        name="distanceUnit"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Distance Unit</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col space-y-1"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="miles" id="miles" />
                                  <Label htmlFor="miles">Miles</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="kilometers" id="kilometers" />
                                  <Label htmlFor="kilometers">Kilometers</Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={themeForm.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Language</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col space-y-1"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="english" id="english" />
                                  <Label htmlFor="english">English</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="french" id="french" />
                                  <Label htmlFor="french">Français</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="arabic" id="arabic" />
                                  <Label htmlFor="arabic">العربية</Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full">
                        Save Preferences
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Manage how you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...notificationsForm}>
                    <form onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)} className="space-y-4">
                      <FormField
                        control={notificationsForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Email Notifications</FormLabel>
                              <FormDescription>
                                Receive emails for important updates
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
                      
                      <FormField
                        control={notificationsForm.control}
                        name="pushNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Push Notifications</FormLabel>
                              <FormDescription>
                                Receive mobile push notifications
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
                      
                      <FormField
                        control={notificationsForm.control}
                        name="appointmentReminders"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Appointment Reminders</FormLabel>
                              <FormDescription>
                                Get reminders before your appointments
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
                      
                      <FormField
                        control={notificationsForm.control}
                        name="serviceUpdates"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Service Updates</FormLabel>
                              <FormDescription>
                                Get updates on your vehicle service status
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
                      
                      <FormField
                        control={notificationsForm.control}
                        name="marketingEmails"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Marketing Emails</FormLabel>
                              <FormDescription>
                                Receive offers and promotions from our partners
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
                      
                      <Button type="submit" className="w-full">
                        Save Preferences
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Payment Tab */}
            <TabsContent value="payment">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>
                    Manage your payment options
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center">
                        <CreditCard className="h-6 w-6 text-blue-600 mr-3" />
                        <div>
                          <p className="font-medium">Visa / Mastercard</p>
                          <p className="text-sm text-muted-foreground">Pay with credit or debit card</p>
                        </div>
                      </div>
                      
                      {/* Payment Card Dialog */}
                      <Dialog open={isAddCardOpen} onOpenChange={setIsAddCardOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline">Add Card</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Add Payment Card</DialogTitle>
                          </DialogHeader>
                          
                          <Form {...paymentCardForm}>
                            <form onSubmit={paymentCardForm.handleSubmit(onPaymentCardSubmit)} className="space-y-4 mt-4">
                              <FormField
                                control={paymentCardForm.control}
                                name="cardNumber"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Card Number</FormLabel>
                                    <FormControl>
                                      <Input placeholder="4111 1111 1111 1111" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={paymentCardForm.control}
                                  name="expirationDate"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Expiration Date</FormLabel>
                                      <FormControl>
                                        <Input placeholder="MM/YY" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={paymentCardForm.control}
                                  name="cvv"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>CVV</FormLabel>
                                      <FormControl>
                                        <Input placeholder="123" type="password" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              
                              <FormField
                                control={paymentCardForm.control}
                                name="cardholderName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Cardholder Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter your name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <Button 
                                type="submit" 
                                className="w-full" 
                                disabled={isAddingCard}
                              >
                                {isAddingCard ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding Card...
                                  </>
                                ) : (
                                  "Add Card"
                                )}
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center">
                        <svg className="h-6 w-6 mr-3" viewBox="0 0 24 24" fill="#00457C">
                          <path d="M20.7 5H3.3C2 5 1 6 1 7.3v9.3C1 18 2 19 3.3 19h17.3c1.3 0 2.3-1 2.3-2.3V7.3C23 6 22 5 20.7 5zM3.3 17.7c-.6 0-1-.4-1-1V7.3c0-.6.4-1 1-1h17.3c.6 0 1 .4 1 1v9.3c0 .6-.4 1-1 1H3.3z"/>
                          <path d="M7 12.7h2.7c.5 0 .9-.2 1.2-.5.3-.3.4-.7.4-1.2 0-.5-.1-.9-.4-1.2-.3-.3-.7-.5-1.2-.5H7v3.4zm1.3-2.1h1.3c.2 0 .3.1.4.2.1.1.2.3.2.4 0 .2-.1.3-.2.4-.1.1-.3.2-.4.2H8.3v-1.2zM11.3 12.7h1.3v-3.4h-1.3zM14.3 12.7h1.3v-2.1l1.9 2.1h1.6l-2.1-2.3 2-1.1h-1.8l-1.6.9h-.1V9.3h-1.3z"/>
                        </svg>
                        <div>
                          <p className="font-medium">PayPal</p>
                          <p className="text-sm text-muted-foreground">Pay with your PayPal account</p>
                        </div>
                      </div>
                      
                      {/* PayPal Connect Dialog */}
                      <Dialog open={isPayPalDialogOpen} onOpenChange={setIsPayPalDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline">Connect</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Connect PayPal Account</DialogTitle>
                            <DialogDescription>
                              Enter your PayPal developer credentials to connect your account
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label htmlFor="client-id">Client ID</Label>
                              <Input 
                                id="client-id" 
                                placeholder="Enter your PayPal Client ID" 
                              />
                              <p className="text-xs text-muted-foreground">Identifies your application in the PayPal ecosystem</p>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="secret-key">Secret Key</Label>
                              <Input 
                                id="secret-key" 
                                type="password"
                                placeholder="Enter your PayPal Secret Key" 
                              />
                              <p className="text-xs text-muted-foreground">Used for server-side authentication</p>
                            </div>
                            
                            <div className="space-y-2 pt-2 border-t border-dashed">
                              <Label htmlFor="paypal-otp" className="flex items-center">
                                <span className="mr-2">OTP Verification</span>
                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">Required</span>
                              </Label>
                              <Input 
                                id="paypal-otp" 
                                placeholder="Enter 6-digit code"
                                className="text-center tracking-widest text-lg"
                                maxLength={6}
                              />
                              <div className="flex justify-between">
                                <p className="text-xs text-muted-foreground">Code expires in 10 minutes</p>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-primary h-auto p-0 text-xs"
                                >
                                  Send code
                                </Button>
                              </div>
                            </div>
                            
                            <div className="pt-4 flex justify-end space-x-2">
                              <Button 
                                variant="outline"
                                onClick={() => setIsPayPalDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                type="submit"
                                onClick={() => {
                                  // Close the dialog
                                  setIsPayPalDialogOpen(false);
                                  
                                  // Show success toast
                                  toast({
                                    title: "Success!",
                                    description: "PayPal account connected successfully",
                                    variant: "success",
                                  });
                                }}
                              >
                                Verify & Connect
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center">
                        <svg className="h-6 w-6 mr-3" viewBox="0 0 24 24" fill="#6772E5">
                          <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.861 6.09 1.631l.89-5.494C18.252.984 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.831 3.47 1.426 3.47 2.338 0 .891-.712 1.402-2.172 1.402-1.73 0-4.515-.831-6.392-1.934l-.89 5.494c2.227 1.305 5.007 1.872 8.406 1.872 2.526 0 4.633-.593 6.09-1.769 1.605-1.275 2.408-3.12 2.408-5.463-.03-4.148-2.526-5.845-6.487-7.304z"/>
                        </svg>
                        <div>
                          <p className="font-medium">Stripe</p>
                          <p className="text-sm text-muted-foreground">Pay with various cards via Stripe</p>
                        </div>
                      </div>
                      
                      {/* Stripe Connect with OTP Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline">Connect</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Connect Stripe Account</DialogTitle>
                            <DialogDescription>
                              Enter the OTP code sent to your registered phone number for verification
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label htmlFor="otp-code">OTP Verification Code</Label>
                              <Input 
                                id="otp-code" 
                                placeholder="Enter 6-digit code" 
                                className="text-center tracking-widest text-lg"
                                maxLength={6}
                              />
                              <p className="text-xs text-muted-foreground">The code will expire in 10 minutes</p>
                            </div>
                            
                            <div className="pt-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-primary h-auto p-0"
                              >
                                Resend code
                              </Button>
                            </div>
                            
                            <div className="pt-4 flex justify-end space-x-2">
                              <Button 
                                variant="outline"
                                onClick={() => {
                                  const dialog = document.querySelector('dialog');
                                  if (dialog) dialog.close();
                                }}
                              >
                                Cancel
                              </Button>
                              <Button type="submit"
                                onClick={() => {
                                  // Close the dialog programmatically
                                  const dialogClose = document.querySelector('[role="dialog"] button[aria-label="Close"]');
                                  if (dialogClose instanceof HTMLButtonElement) {
                                    dialogClose.click();
                                  }
                                  
                                  // Show success toast
                                  toast({
                                    title: "Success!",
                                    description: "Stripe account connected successfully",
                                    variant: "success",
                                  });
                                }}
                              >
                                Verify & Connect
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Security Tab */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Update your password and security preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...securityForm}>
                    <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-4">
                      <FormField
                        control={securityForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={securityForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={securityForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full">
                        Update Password
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Help Tab */}
            <TabsContent value="help">
              <Card>
                <CardHeader>
                  <CardTitle>Help & Support</CardTitle>
                  <CardDescription>
                    Get help and contact support
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">Frequently Asked Questions</h3>
                      <p className="text-sm text-muted-foreground mb-2">Find answers to common questions</p>
                      <Button variant="outline" className="w-full">View FAQs</Button>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">Contact Support</h3>
                      <p className="text-sm text-muted-foreground mb-2">Get help from our customer service team</p>
                      <Button variant="outline" className="w-full">Contact Us</Button>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">About RenaultPro</h3>
                      <p className="text-sm text-muted-foreground mb-2">App version: 1.0.0</p>
                      <div className="flex space-x-2">
                        <Button variant="outline" className="flex-1">Privacy Policy</Button>
                        <Button variant="outline" className="flex-1">Terms of Service</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Logout Button */}
          <Button 
            variant="outline" 
            className="w-full mt-6 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
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
