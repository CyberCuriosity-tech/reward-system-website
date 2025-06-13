export const translations = {
  en: {
    welcome_title: "Welcome to SweetSweetWay loyalty/rewards",
    welcome_subtitle: "Convert your phone to a reward pass",
    create_account: "Create Your Account",
    enter_details: "Enter your details to get started",
    first_name: "First name",
    last_name: "Last name",
    phone_number: "Phone number",
    join_program: "Join Rewards Program",
    creating_account: "Creating Account...",
    demo_system: "Want to see how the 5-visit reward system works?",
    view_demo: "View Demo Dashboard",
    almost_ready: "You're Almost Ready!",
    add_to_wallet: "Add your loyalty pass to your wallet for easy access",
    account_created: "Account Created Successfully!",
    pass_ready: "Your loyalty pass is ready to download.",
    scan_phone: "Scan with your phone to add to wallet",
    continue_dashboard: "Continue to Dashboard",
    earn_points_visit: "You'll earn 1 point for each visit. Get a free reward after just 5 visits! 🎉",
    quick_rewards: "⚡ Quick Rewards: Only 5 visits to unlock your first reward!",
    welcome_back: "Welcome back, {{name}}! 👋",
    track_progress: "Track your visits and rewards progress",
    total_visits: "Total Visits",
    current_points: "Current Points",
    visits_until_reward: "Visits Until Reward",
    reward_progress: "Reward Progress",
    reward_ready: "🎉 Reward Ready!",
    free_reward: "Free reward! 🎁",
    keep_going: "Keep going!",
    total_rewards_earned: "Total Rewards Earned",
    congrats_reward: "Congratulations on your latest reward! 🎉",
    more_visits_needed: "{{count}} more visits to your next reward!",
    how_to_earn: "How to Earn Points",
    faster_system: "⚡ New: Get rewards faster with our 5-visit system!",
    visit_store: "Visit Our Store",
    visit_store_desc: "Come to our physical location",
    show_pass: "Show Your Pass",
    show_pass_desc: "Present your wallet pass to our staff",
    earn_fast: "Earn Points Fast",
    earn_fast_desc: "Get 1 point per visit - only 5 points needed for a free reward! 🚀",
    pro_tip: "💡 Pro Tip",
    pro_tip_desc: "With our new 5-visit reward system, you'll earn rewards twice as fast! Perfect for regular customers who want to see their loyalty rewarded quickly.",
    demo_mode: "Demo Mode: This shows how the 5-visit reward system works",
    back_to_registration: "Back to Registration",
    so_close: "🔥 So close! Just 1 more visit to unlock your reward!",
    add_to_apple_wallet: "Add to Apple Wallet",
    add_to_google_wallet: "Add to Google Wallet",
    scan_qr_code: "Scan QR Code",
    apple_wallet: "Apple Wallet",
    google_wallet: "Google Wallet",
    mobile_wallet: "Mobile Wallet",
    language: "Language"
  },
  es: {
    welcome_title: "Bienvenido al programa de lealtad/recompensas SweetSweetWay",
    welcome_subtitle: "Convierte tu teléfono en un pase de recompensas",
    create_account: "Crea Tu Cuenta",
    enter_details: "Ingresa tus datos para comenzar",
    first_name: "Nombre",
    last_name: "Apellido",
    phone_number: "Número de teléfono",
    join_program: "Únete al Programa de Recompensas",
    creating_account: "Creando Cuenta...",
    demo_system: "¿Quieres ver cómo funciona el sistema de 5 visitas?",
    view_demo: "Ver Demo del Panel",
    almost_ready: "¡Ya Casi Estás Listo!",
    add_to_wallet: "Agrega tu pase de lealtad a tu billetera para fácil acceso",
    account_created: "¡Cuenta Creada Exitosamente!",
    pass_ready: "Tu pase de lealtad está listo para descargar.",
    scan_phone: "Escanea con tu teléfono para agregar a la billetera",
    continue_dashboard: "Continuar al Panel",
    earn_points_visit: "¡Ganarás 1 punto por cada visita. Obtén una recompensa gratis después de solo 5 visitas! 🎉",
    quick_rewards: "⚡ Recompensas Rápidas: ¡Solo 5 visitas para desbloquear tu primera recompensa!",
    welcome_back: "¡Bienvenido de vuelta, {{name}}! 👋",
    track_progress: "Rastrea tus visitas y progreso de recompensas",
    total_visits: "Visitas Totales",
    current_points: "Puntos Actuales",
    visits_until_reward: "Visitas Hasta Recompensa",
    reward_progress: "Progreso de Recompensas",
    reward_ready: "🎉 ¡Recompensa Lista!",
    free_reward: "¡Recompensa gratis! 🎁",
    keep_going: "¡Sigue así!",
    total_rewards_earned: "Total de Recompensas Obtenidas",
    congrats_reward: "¡Felicitaciones por tu última recompensa! 🎉",
    more_visits_needed: "¡{{count}} visitas más para tu próxima recompensa!",
    how_to_earn: "Cómo Ganar Puntos",
    faster_system: "⚡ Nuevo: ¡Obtén recompensas más rápido con nuestro sistema de 5 visitas!",
    visit_store: "Visita Nuestra Tienda",
    visit_store_desc: "Ven a nuestra ubicación física",
    show_pass: "Muestra Tu Pase",
    show_pass_desc: "Presenta tu pase de billetera a nuestro personal",
    earn_fast: "Gana Puntos Rápido",
    earn_fast_desc: "¡Obtén 1 punto por visita - solo necesitas 5 puntos para una recompensa gratis! 🚀",
    pro_tip: "💡 Consejo Pro",
    pro_tip_desc: "¡Con nuestro nuevo sistema de recompensas de 5 visitas, ganarás recompensas el doble de rápido! Perfecto para clientes regulares que quieren ver su lealtad recompensada rápidamente.",
    demo_mode: "Modo Demo: Esto muestra cómo funciona el sistema de 5 visitas",
    back_to_registration: "Volver al Registro",
    so_close: "🔥 ¡Tan cerca! ¡Solo 1 visita más para desbloquear tu recompensa!",
    add_to_apple_wallet: "Agregar a Apple Wallet",
    add_to_google_wallet: "Agregar a Google Wallet",
    scan_qr_code: "Escanear Código QR",
    apple_wallet: "Apple Wallet",
    google_wallet: "Google Wallet",
    mobile_wallet: "Billetera Móvil",
    language: "Idioma"
  }
};

export type Language = 'en' | 'es';

export class SimpleI18n {
  private currentLanguage: Language = 'en';

  constructor() {
    // Auto-detect language
    const browserLang = navigator.language.substring(0, 2) as Language;
    const savedLang = localStorage.getItem('language') as Language;
    
    if (savedLang && translations[savedLang]) {
      this.currentLanguage = savedLang;
    } else if (translations[browserLang]) {
      this.currentLanguage = browserLang;
    }
  }

  t(key: string, params?: Record<string, string | number>): string {
    let text = translations[this.currentLanguage][key as keyof typeof translations.en] || key;
    
    if (params) {
      Object.keys(params).forEach(param => {
        text = text.replace(`{{${param}}}`, String(params[param]));
      });
    }
    
    return text;
  }

  changeLanguage(lang: Language) {
    this.currentLanguage = lang;
    localStorage.setItem('language', lang);
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }
}

export const i18n = new SimpleI18n();