export type Translation = {
  // Common
  appName: string;
  loading: string;
  error: string;
  welcome: string;
  
  // Auth
  login: string;
  register: string;
  username: string;
  password: string;
  email: string;
  fullName: string;
  submit: string;
  forgotPassword: string;
  
  // Navigation
  home: string;
  profile: string;
  appointments: string;
  garages: string;
  settings: string;
  
  // Home Page
  quickActions: string;
  viewServiceHistory: string;
  vehicleStatus: string;
  nextServiceDue: string;
  lastInspection: string;
  
  // Vehicle Management
  vehicles: string;
  addVehicle: string;
  editVehicle: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  licensePlate: string;
  vin: string;
  chipsetCode: string;
  fuelType: string;
  primaryVehicle: string;
  
  // Appointment Booking
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  appointmentNotes: string;
  bookAppointment: string;
  
  // Garage Locator
  nearbyGarages: string;
  searchGarages: string;
  distance: string;
  directions: string;
  
  // Settings
  appearance: string;
  notifications: string;
  security: string;
  help: string;
  language: string;
  distanceUnit: string;
  english: string;
  french: string;
  arabic: string;
  miles: string;
  kilometers: string;
  
  // App Preferences
  theme: string;
  lightTheme: string;
  darkTheme: string;
  systemTheme: string;
  savePreferences: string;
};

// English translations
export const enTranslations: Translation = {
  // Common
  appName: "RenaultPro",
  loading: "Loading...",
  error: "An error occurred",
  welcome: "Welcome back",
  
  // Home Page
  quickActions: "Quick Actions",
  viewServiceHistory: "View Service History",
  vehicleStatus: "Vehicle Status",
  nextServiceDue: "Next service due",
  lastInspection: "Last inspection",
  
  // Auth
  login: "Login",
  register: "Register",
  username: "Username",
  password: "Password",
  email: "Email",
  fullName: "Full Name",
  submit: "Submit",
  forgotPassword: "Forgot Password?",
  
  // Navigation
  home: "Home",
  profile: "Profile",
  appointments: "Appointments",
  garages: "Garages",
  settings: "Settings",
  
  // Vehicle Management
  vehicles: "Vehicles",
  addVehicle: "Add Vehicle",
  editVehicle: "Edit Vehicle",
  vehicleMake: "Make",
  vehicleModel: "Model",
  vehicleYear: "Year",
  licensePlate: "License Plate",
  vin: "VIN",
  chipsetCode: "Chipset Code",
  fuelType: "Fuel Type",
  primaryVehicle: "Primary Vehicle",
  
  // Appointment Booking
  appointmentDate: "Date",
  appointmentTime: "Time",
  appointmentType: "Service Type",
  appointmentNotes: "Notes",
  bookAppointment: "Book Appointment",
  
  // Garage Locator
  nearbyGarages: "Nearby Garages",
  searchGarages: "Search Garages",
  distance: "Distance",
  directions: "Get Directions",
  
  // Settings
  appearance: "Appearance",
  notifications: "Notifications",
  security: "Security",
  help: "Help & Support",
  language: "Language",
  distanceUnit: "Distance Unit",
  english: "English",
  french: "French",
  arabic: "Arabic",
  miles: "Miles",
  kilometers: "Kilometers",
  
  // App Preferences
  theme: "Theme",
  lightTheme: "Light",
  darkTheme: "Dark",
  systemTheme: "System",
  savePreferences: "Save Preferences",
};

// French translations
export const frTranslations: Translation = {
  // Common
  appName: "RenaultPro Tunisie",
  loading: "Chargement...",
  error: "Une erreur est survenue",
  welcome: "Bienvenue",
  
  // Home Page
  quickActions: "Actions Rapides",
  viewServiceHistory: "Historique de Service",
  vehicleStatus: "État du Véhicule",
  nextServiceDue: "Prochain entretien prévu",
  lastInspection: "Dernière inspection",
  
  // Auth
  login: "Connexion",
  register: "Inscription",
  username: "Nom d'utilisateur",
  password: "Mot de passe",
  email: "Email",
  fullName: "Nom complet",
  submit: "Soumettre",
  forgotPassword: "Mot de passe oublié?",
  
  // Navigation
  home: "Accueil",
  profile: "Profil",
  appointments: "Rendez-vous",
  garages: "Garages",
  settings: "Paramètres",
  
  // Vehicle Management
  vehicles: "Véhicules",
  addVehicle: "Ajouter un véhicule",
  editVehicle: "Modifier le véhicule",
  vehicleMake: "Marque",
  vehicleModel: "Modèle",
  vehicleYear: "Année",
  licensePlate: "Plaque d'immatriculation",
  vin: "Numéro de série",
  chipsetCode: "Code de puce",
  fuelType: "Type de carburant",
  primaryVehicle: "Véhicule principal",
  
  // Appointment Booking
  appointmentDate: "Date",
  appointmentTime: "Heure",
  appointmentType: "Type de service",
  appointmentNotes: "Notes",
  bookAppointment: "Prendre rendez-vous",
  
  // Garage Locator
  nearbyGarages: "Garages à proximité",
  searchGarages: "Rechercher des garages",
  distance: "Distance",
  directions: "Obtenir les directions",
  
  // Settings
  appearance: "Apparence",
  notifications: "Notifications",
  security: "Sécurité",
  help: "Aide et support",
  language: "Langue",
  distanceUnit: "Unité de distance",
  english: "Anglais",
  french: "Français",
  arabic: "Arabe",
  miles: "Miles",
  kilometers: "Kilomètres",
  
  // App Preferences
  theme: "Thème",
  lightTheme: "Clair",
  darkTheme: "Sombre",
  systemTheme: "Système",
  savePreferences: "Enregistrer les préférences",
};

// Arabic translations
export const arTranslations: Translation = {
  // Common
  appName: "رينو برو تونس",
  loading: "جاري التحميل...",
  error: "حدث خطأ",
  welcome: "مرحبًا بعودتك",
  
  // Home Page
  quickActions: "إجراءات سريعة",
  viewServiceHistory: "عرض تاريخ الخدمة",
  vehicleStatus: "حالة المركبة",
  nextServiceDue: "موعد الصيانة القادم",
  lastInspection: "آخر فحص",
  
  // Auth
  login: "تسجيل الدخول",
  register: "التسجيل",
  username: "اسم المستخدم",
  password: "كلمة المرور",
  email: "البريد الإلكتروني",
  fullName: "الاسم الكامل",
  submit: "إرسال",
  forgotPassword: "نسيت كلمة المرور؟",
  
  // Navigation
  home: "الرئيسية",
  profile: "الملف الشخصي",
  appointments: "المواعيد",
  garages: "الورش",
  settings: "الإعدادات",
  
  // Vehicle Management
  vehicles: "المركبات",
  addVehicle: "إضافة مركبة",
  editVehicle: "تعديل المركبة",
  vehicleMake: "الصانع",
  vehicleModel: "الطراز",
  vehicleYear: "السنة",
  licensePlate: "لوحة الترخيص",
  vin: "رقم التعريف",
  chipsetCode: "رمز الشريحة",
  fuelType: "نوع الوقود",
  primaryVehicle: "المركبة الرئيسية",
  
  // Appointment Booking
  appointmentDate: "التاريخ",
  appointmentTime: "الوقت",
  appointmentType: "نوع الخدمة",
  appointmentNotes: "ملاحظات",
  bookAppointment: "حجز موعد",
  
  // Garage Locator
  nearbyGarages: "الورش القريبة",
  searchGarages: "البحث عن ورش",
  distance: "المسافة",
  directions: "الحصول على الاتجاهات",
  
  // Settings
  appearance: "المظهر",
  notifications: "الإشعارات",
  security: "الأمان",
  help: "المساعدة والدعم",
  language: "اللغة",
  distanceUnit: "وحدة المسافة",
  english: "الإنجليزية",
  french: "الفرنسية",
  arabic: "العربية",
  miles: "ميل",
  kilometers: "كيلومتر",
  
  // App Preferences
  theme: "السمة",
  lightTheme: "فاتح",
  darkTheme: "داكن",
  systemTheme: "النظام",
  savePreferences: "حفظ التفضيلات",
};