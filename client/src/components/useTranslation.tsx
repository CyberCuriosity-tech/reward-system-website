import { useState } from 'react';

// Simple translation keys - in a full app this would be a proper i18n library
const translations = {
  en: {
    selectLanguage: 'Select Language',
    // Welcome section
    'welcome.title': 'Welcome to SweetSweetWay loyalty/rewards',
    'welcome.subtitle': 'Convert your phone to a reward pass.',
    // Registration
    'registration.createAccount': 'Create Your Account',
    'registration.enterDetails': 'Enter your details to get started',
    'registration.firstName': 'First name',
    'registration.lastName': 'Last name',
    'registration.phoneNumber': 'Phone number',
    'registration.joinProgram': 'Join Rewards Program',
    'registration.creatingAccount': 'Creating Account...',
    // Demo
    'demo.description': 'Want to see how the 5-visit reward system works?',
    'demo.viewDemo': 'View Demo Dashboard',
    'demo.modeActive': 'Demo Mode: This shows how the 5-visit reward system works',
    'demo.backToRegistration': 'Back to Registration',
    // Pass Download
    'passDownload.almostReady': "You're Almost Ready!",
    'passDownload.addToWallet': 'Add your loyalty pass to your wallet for easy access',
    'passDownload.accountCreated': 'Account Created Successfully!',
    'passDownload.helloUser': 'Hello {{name}}! Your loyalty pass is ready to download.',
    'passDownload.appleWallet': 'Apple Wallet',
    'passDownload.googleWallet': 'Google Wallet',
    'passDownload.mobileWallet': 'Mobile Wallet',
    'passDownload.addToAppleWallet': 'Add to Apple Wallet',
    'passDownload.addToGoogleWallet': 'Add to Google Wallet',
    'passDownload.scanQrCode': 'Scan QR Code',
    'passDownload.scanWithPhone': 'Scan with your phone to add to wallet',
    'passDownload.earnPoints': "You'll earn 1 point for each visit. Get a free reward after just 5 visits! 🎉",
    'passDownload.quickRewards': '⚡ Quick Rewards: Only 5 visits to unlock your first reward!',
    'passDownload.continueToDashboard': 'Continue to Dashboard',
    // Dashboard
    'dashboard.welcomeBack': 'Welcome back, {{name}}! 👋',
    'dashboard.trackProgress': 'Track your visits and rewards progress',
    'dashboard.soClose': '🔥 So close! Just 1 more visit to unlock your reward!',
    'dashboard.totalVisits': 'Total Visits',
    'dashboard.currentPoints': 'Current Points',
    'dashboard.visitsUntilReward': 'Visits Until Reward',
    'dashboard.rewardProgress': 'Reward Progress',
    'dashboard.rewardReady': '🎉 Reward Ready!',
    'dashboard.keepGoing': 'Keep going!',
    'dashboard.freeReward': 'Free reward! 🎁',
    'dashboard.totalRewardsEarned': 'Total Rewards Earned',
    'dashboard.congratulations': 'Congratulations on your latest reward! 🎉',
    'dashboard.moreVisitsNeeded': '{{count}} more visits to your next reward!',
    // How to Earn
    'howToEarn.title': 'How to Earn Points',
    'howToEarn.subtitle': '⚡ New: Get rewards faster with our 5-visit system!',
    'howToEarn.step1Title': 'Visit Our Store',
    'howToEarn.step1Description': 'Come to our physical location',
    'howToEarn.step2Title': 'Show Your Pass',
    'howToEarn.step2Description': 'Present your wallet pass to our staff',
    'howToEarn.step3Title': 'Earn Points Fast',
    'howToEarn.step3Description': 'Get 1 point per visit - only 5 points needed for a free reward! 🚀',
    'howToEarn.proTip': '💡 Pro Tip',
    'howToEarn.proTipDescription': "With our new 5-visit reward system, you'll earn rewards twice as fast! Perfect for regular customers who want to see their loyalty rewarded quickly.",
    // Progress
    'progress.visits': '{{current}} / {{total}} visits',
    // Errors
    'errors.registrationFailed': 'Registration failed. Please try again.',
  },
  es: {
    selectLanguage: 'Seleccionar Idioma',
    // Welcome section
    'welcome.title': 'Bienvenido a SweetSweetWay lealtad/recompensas',
    'welcome.subtitle': 'Convierte tu teléfono en un pase de recompensas.',
    // Registration
    'registration.createAccount': 'Crea Tu Cuenta',
    'registration.enterDetails': 'Ingresa tus datos para comenzar',
    'registration.firstName': 'Nombre',
    'registration.lastName': 'Apellido',
    'registration.phoneNumber': 'Número de teléfono',
    'registration.joinProgram': 'Unirse al Programa de Recompensas',
    'registration.creatingAccount': 'Creando Cuenta...',
    // Demo
    'demo.description': '¿Quieres ver cómo funciona el sistema de recompensas de 5 visitas?',
    'demo.viewDemo': 'Ver Panel de Demostración',
    'demo.modeActive': 'Modo Demo: Esto muestra cómo funciona el sistema de recompensas de 5 visitas',
    'demo.backToRegistration': 'Volver al Registro',
    // Pass Download
    'passDownload.almostReady': '¡Ya Casi Estás Listo!',
    'passDownload.addToWallet': 'Agrega tu pase de lealtad a tu billetera para fácil acceso',
    'passDownload.accountCreated': '¡Cuenta Creada Exitosamente!',
    'passDownload.helloUser': '¡Hola {{name}}! Tu pase de lealtad está listo para descargar.',
    'passDownload.appleWallet': 'Apple Wallet',
    'passDownload.googleWallet': 'Google Wallet',
    'passDownload.mobileWallet': 'Billetera Móvil',
    'passDownload.addToAppleWallet': 'Agregar a Apple Wallet',
    'passDownload.addToGoogleWallet': 'Agregar a Google Wallet',
    'passDownload.scanQrCode': 'Escanear Código QR',
    'passDownload.scanWithPhone': 'Escanea con tu teléfono para agregar a la billetera',
    'passDownload.earnPoints': '¡Ganarás 1 punto por cada visita. Obtén una recompensa gratis después de solo 5 visitas! 🎉',
    'passDownload.quickRewards': '⚡ Recompensas Rápidas: ¡Solo 5 visitas para desbloquear tu primera recompensa!',
    'passDownload.continueToDashboard': 'Continuar al Panel',
    // Dashboard
    'dashboard.welcomeBack': '¡Bienvenido de nuevo, {{name}}! 👋',
    'dashboard.trackProgress': 'Sigue tu progreso de visitas y recompensas',
    'dashboard.soClose': '🔥 ¡Tan cerca! ¡Solo 1 visita más para desbloquear tu recompensa!',
    'dashboard.totalVisits': 'Visitas Totales',
    'dashboard.currentPoints': 'Puntos Actuales',
    'dashboard.visitsUntilReward': 'Visitas Hasta Recompensa',
    'dashboard.rewardProgress': 'Progreso de Recompensa',
    'dashboard.rewardReady': '🎉 ¡Recompensa Lista!',
    'dashboard.keepGoing': '¡Sigue así!',
    'dashboard.freeReward': '¡Recompensa gratis! 🎁',
    'dashboard.totalRewardsEarned': 'Total de Recompensas Ganadas',
    'dashboard.congratulations': '¡Felicidades por tu última recompensa! 🎉',
    'dashboard.moreVisitsNeeded': '¡{{count}} visitas más hasta tu próxima recompensa!',
    // How to Earn
    'howToEarn.title': 'Cómo Ganar Puntos',
    'howToEarn.subtitle': '⚡ Nuevo: ¡Obtén recompensas más rápido con nuestro sistema de 5 visitas!',
    'howToEarn.step1Title': 'Visita Nuestra Tienda',
    'howToEarn.step1Description': 'Ven a nuestra ubicación física',
    'howToEarn.step2Title': 'Muestra Tu Pase',
    'howToEarn.step2Description': 'Presenta tu pase de billetera a nuestro personal',
    'howToEarn.step3Title': 'Gana Puntos Rápido',
    'howToEarn.step3Description': '¡Obtén 1 punto por visita - solo se necesitan 5 puntos para una recompensa gratis! 🚀',
    'howToEarn.proTip': '💡 Consejo Pro',
    'howToEarn.proTipDescription': '¡Con nuestro nuevo sistema de recompensas de 5 visitas, ganarás recompensas el doble de rápido! Perfecto para clientes regulares que quieren ver su lealtad recompensada rápidamente.',
    // Progress
    'progress.visits': '{{current}} / {{total}} visitas',
    // Errors
    'errors.registrationFailed': 'El registro falló. Por favor, inténtalo de nuevo.',
  },
};

// Simple i18n hook
export function useTranslation() {
  const [language, setLanguage] = useState(() => {
    // Try to get from localStorage first
    const savedLang = localStorage.getItem('selectedLanguage');
    if (savedLang && ['en', 'es'].includes(savedLang)) {
      return savedLang;
    }
    
    // Auto-detect browser language
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('es')) {
      return 'es';
    }
    return 'en'; // default to English
  });

  const changeLanguage = (newLang: string) => {
    setLanguage(newLang);
    localStorage.setItem('selectedLanguage', newLang);
    window.location.reload();
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    const translation = translations[language as keyof typeof translations];
    let text = translation[key as keyof typeof translation] || key;
    
    // Simple interpolation for {{param}} patterns
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
      });
    }
    
    return text;
  };

  return { t, language, changeLanguage };
}