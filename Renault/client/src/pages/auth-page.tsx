import logo from '../assets/logo.png';
import logo2 from '../assets/logo2.png';
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, UserPlus, LogIn, Users, FileCheck, CreditCard, Phone } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

// Login schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Registration schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().min(8, "Phone number must be at least 8 characters"),
  isTunisian: z.boolean().default(true),
  documentType: z.enum(["CIN", "Passport"]).default("CIN"),
  documentNumber: z.string().min(1, "Document number is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { loginMutation, registerMutation, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Parse redirect URL from query params if available
  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get("redirect") || "/";

  // Redirect if user is already logged in - using useEffect to avoid setState during render
  useEffect(() => {
    if (user) {
      navigate(redirectPath);
    }
  }, [user, navigate, redirectPath]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      phoneNumber: "",
      isTunisian: true,
      documentType: "CIN",
      documentNumber: "",
    },
  });

  // Submit handlers
  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values, {
      onSuccess: () => {
        navigate(redirectPath);
      },
    });
  };

  const onRegisterSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate({
      ...values,
      isAdmin: false,
    }, {
      onSuccess: () => {
        navigate(redirectPath);
      },
    });
  };

  return (
    <div className="min-h-screen bg-muted flex flex-col md:flex-row">
      <div className="bg-primary text-primary-foreground p-8 flex flex-col justify-center md:w-1/2">
        <div className="max-w-md mx-auto">
          <div className="flex items-center space-x-2 mb-6">
            <img src={logo2} alt="logo2" className="h-12 w-12" />
            <h1 className="text-3xl font-bold">RenaultPro</h1>
          </div>
          <h2 className="text-2xl font-bold mb-4">Official Renault Service</h2>
          <p className="mb-6">
            Find the nearest Renault garages, verify the authenticity of your vehicle and book an appointment easily.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-primary-foreground/20 p-2 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4l3 3" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold">Quick Appointments</h3>
                <p className="text-primary-foreground/80">Schedule your Renault service in just a few seconds.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-primary-foreground/20 p-2 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold">Renault House</h3>
                <p className="text-primary-foreground/80">Explore an interactive map of Renault locations worldwide.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form section */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex flex-col items-center gap-4 mb-4">
              <img src={logo} alt="logo" className="h-32 w-32" />
              <CardTitle className="text-2xl text-center">Bienvenue sur RenaultPro</CardTitle>
            </div>
            <CardDescription className="text-center">
              {activeTab === "login" ? "Connectez-vous à votre compte" : "Créez un nouveau compte"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="login">Connexion</TabsTrigger>
                <TabsTrigger value="register">Inscription</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          <LogIn className="mr-2 h-4 w-4" />
                          Sign In
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Create a password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                              <Input placeholder="+216 XX XXX XXX" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="isTunisian"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg space-y-0">
                          <div className="space-y-0.5">
                            <FormLabel>Tunisian Citizen</FormLabel>
                            <FormDescription className="text-xs">
                              Are you a Tunisian citizen?
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                registerForm.setValue("documentType", checked ? "CIN" : "Passport");
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="documentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Type</FormLabel>
                          <FormControl>
                            <Select
                              disabled={registerForm.watch("isTunisian")}
                              onValueChange={(value) => {
                                field.onChange(value);
                                if (value === "Passport") {
                                  registerForm.setValue("password", "");
                                }
                              }}
                              value={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select document type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CIN">
                                  <div className="flex items-center">
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    <span>CIN (Tunisian ID)</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Passport">
                                  <div className="flex items-center">
                                    <FileCheck className="w-4 h-4 mr-2" />
                                    <span>Passport</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>
                            {registerForm.watch("isTunisian")
                              ? "For Tunisian citizens, CIN is required"
                              : "For foreign citizens, passport number is required"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="documentNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {registerForm.watch("documentType") === "CIN" ? "CIN Number" : "Passport Number"}
                          </FormLabel>
                          <FormControl>
                            <div className="flex items-center">
                              {registerForm.watch("documentType") === "CIN" ? (
                                <CreditCard className="w-4 h-4 mr-2 text-muted-foreground" />
                              ) : (
                                <FileCheck className="w-4 h-4 mr-2 text-muted-foreground" />
                              )}
                              <Input
                                placeholder={
                                  registerForm.watch("documentType") === "CIN"
                                    ? "Enter your CIN number"
                                    : "Enter your passport number"
                                }
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Create Account
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

