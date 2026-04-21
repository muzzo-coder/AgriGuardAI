import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      nav_how_it_works: "How it works",
      nav_accuracy: "Accuracy",
      nav_support: "Support",
      ai_core_online: "AI Core Online",
      hero_title: "Protect your crops with Advanced Intelligence",
      hero_subtitle: "Instantly identify plant leaf diseases using our state-of-the-art neural network. Upload a photo and get precise diagnostics with organic treatment recommendations.",
      upload_title: "Upload Leaf Image",
      upload_subtitle: "Click to browse or drag & drop",
      btn_analyze: "Analyze Now",
      btn_analyzing: "Analyzing...",
      btn_open_camera: "Open Camera",
      btn_capture: "Capture",
      btn_retake: "Retake",
      chat_title: "AgriGuard AI Assistant",
      chat_subtitle: "Expert Agricultural Guidance",
      chat_placeholder: "Type your gardening query...",
      chat_listening: "Listening...",
      chat_processing: "AI is processing...",
      result_severity: "{{severity}} Severity",
      result_diagnostic_summary: "Diagnostic Summary",
      result_organic_treatment: "Organic Treatment",
      result_prevention_protocol: "Prevention Protocol",
      result_download_report: "Download Case Report (PDF)",
      result_disclaimer: "AI analysis is based on visual patterns. For large-scale diagnostics, please consult with a certified regional agronomist.",
      err_camera_fail: "Camera access denied or not supported.",
      err_mic_fail: "Voice input not supported in this browser.",
      err_server_fail: "Server not reachable. Please ensure the backend is running.",
      retry_connection: "Retry Connection",
      history_title: "Recent Scans",
      history_clear: "Clear History",
      history_empty: "Inventory Empty",
      history_export: "Export Field History",
      history_disclaimer: "Field data is stored locally for maximum privacy and offline accessibility.",
      footer_rights: "© 2026 AgriGuard Neural Systems. All rights reserved."
    }
  },
  hi: {
    translation: {
      // ... existing hi ...
      retry_connection: "कनेक्शन पुनः प्रयास करें",
      history_title: "हाल के स्कैन",
      history_clear: "इतिहास साफ़ करें",
      history_empty: "इन्वेंटरी खाली है",
      history_export: "फील्ड इतिहास निर्यात करें",
      history_disclaimer: "अधिकतम गोपनीयता और ऑफ़लाइन पहुंच के लिए फील्ड डेटा स्थानीय रूप से संग्रहीत किया जाता है।",
      footer_rights: "© 2026 एग्रीगार्ड न्यूरल सिस्टम। सर्वाधिकार सुरक्षित।"
    }
  },
  mr: {
    translation: {
      // ... existing mr ...
      retry_connection: "कनेक्शन पुन्हा प्रयत्न करा",
      history_title: "अलीकडील स्कॅन",
      history_clear: "इतिहास साफ करा",
      history_empty: "इन्व्हेंटरी रिकामी आहे",
      history_export: "फील्ड इतिहास निर्यात करा",
      history_disclaimer: "जास्तीत जास्त गोपनीयता आणि ऑफलाइन प्रवेशासाठी फील्ड डेटा स्थानिक पातळीवर संग्रहित केला जातो.",
      footer_rights: "© 2026 ऍग्रीगार्ड न्यूरल सिस्टम्स. सर्व हक्क राखीव."
    }
  },
  es: {
    translation: {
      // ... existing es ...
      retry_connection: "Reintentar conexión",
      history_title: "Escaneos Recientes",
      history_clear: "Borrar Historial",
      history_empty: "Inventario Vacío",
      history_export: "Exportar Historial",
      history_disclaimer: "Los datos de campo se almacenan localmente para máxima privacidad y acceso sin conexión.",
      footer_rights: "© 2026 AgriGuard Neural Systems. Todos los derechos reservados."
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'cookie', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage']
    },
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
