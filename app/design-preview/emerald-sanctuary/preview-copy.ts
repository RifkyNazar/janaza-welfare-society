import type { Locale } from "@/lib/i18n";

const en = {
  preview: "Homepage preview", current: "Current website", skip: "Skip to content",
  brand: "Janaza Welfare Society", town: "Kattankudy", home: "Home", services: "Services", team: "Team", activities: "Activities", contact: "Contact",
  staff: "Staff access", employeeLogin: "Employee login", employeePortal: "Employee portal", adminLogin: "Admin login", adminDashboard: "Admin dashboard", supervisor: "Supervisor portal",
  menu: "Menu", close: "Close menu", navigation: "Public navigation", language: "Language",
  request: "Request Janaza service", track: "Track your request", heroText: "Janaza assistance for families in Kattankudy, with dignity and practical care.",
  help: "How can we help?", assistance: "Request assistance", updates: "Check request updates", talk: "Contact the society",
  about: "About the society", purpose: "Serving families with care and respect.", aboutText: "We bring our community together to support families with Janaza arrangements, transport, and guidance.", learn: "About our work",
  serviceTitle: "Practical support for your family.", janaza: "Janaza assistance", janazaText: "Tell us what your family needs. Use the service request form to contact the society.", transport: "Transport support", transportText: "Explore our service vehicles and request transport assistance.", fleet: "View our vehicles", people: "Community support", peopleText: "Meet the people responsible for the society’s public service.", meet: "Meet our team",
  leadership: "Our leadership", leadershipTitle: "People entrusted with our service.", president: "President", secretary: "Secretary", treasurer: "Treasurer", call: "Call", callLeader: "Call this community leader",
  latest: "Latest activities", journal: "Community journal", activityTitle: "Updates from our community work.", allActivities: "View all activities", latestUpdate: "Latest update", read: "View activity", more: "More published activities will appear here.", emptyTitle: "No published activities yet.", emptyText: "Community service updates will appear here when they are published.", unavailable: "Activities are temporarily unavailable.", retry: "Please try again later or visit the activities page.", noPhoto: "No approved public photo",
  guidance: "Requesting support", guidanceTitle: "A clear next step.", step1: "Send your request", step1Text: "Choose the service you need and provide your contact details.", step2: "Save your request code", step2Text: "Keep the reference provided after submitting your request.", step3: "Check for updates", step3Text: "Use your request code and mobile number to track progress.",
  support: "Support the society", supportTitle: "Help us continue serving.", supportText: "Find out how you can support the work of Janaza Welfare Society.", footerText: "Serving families in Kattankudy with dignity.", top: "Back to top", source: "Read the verse", publicContent: "Published community activities",
} as const;

const ta: Record<keyof typeof en, string> = {
  preview: "முகப்புப் பக்க முன்னோட்டம்", current: "தற்போதைய இணையதளம்", skip: "உள்ளடக்கத்திற்குச் செல்லவும்",
  brand: "ஜனாஸா நலன்புரிச் சங்கம்", town: "காத்தான்குடி", home: "முகப்பு", services: "சேவைகள்", team: "எமது குழு", activities: "செயற்பாடுகள்", contact: "தொடர்பு",
  staff: "பணியாளர் நுழைவு", employeeLogin: "ஊழியர் உள்நுழைவு", employeePortal: "ஊழியர் தளம்", adminLogin: "நிர்வாகி உள்நுழைவு", adminDashboard: "நிர்வாகத் தளம்", supervisor: "மேற்பார்வையாளர் தளம்",
  menu: "பட்டியல்", close: "பட்டியலை மூடவும்", navigation: "பொது வழிசெலுத்தல்", language: "மொழி",
  request: "ஜனாஸா சேவையைக் கோருக", track: "கோரிக்கையின் நிலையை அறிக", heroText: "காத்தான்குடி குடும்பங்களுக்குக் கண்ணியத்துடனும் நடைமுறை உதவியுடனும் ஜனாஸா சேவை.",
  help: "எவ்வாறு உதவலாம்?", assistance: "உதவியைக் கோருக", updates: "கோரிக்கையின் நிலையை அறிக", talk: "சங்கத்தைத் தொடர்புகொள்க",
  about: "சங்கத்தைப் பற்றி", purpose: "அக்கறையுடனும் மரியாதையுடனும் குடும்பங்களுக்கான சேவை.", aboutText: "ஜனாஸா ஏற்பாடுகள், போக்குவரத்து மற்றும் வழிகாட்டலில் குடும்பங்களுக்கு உதவ எமது சமூகத்தை ஒன்றிணைக்கிறோம்.", learn: "எமது பணியை அறிக",
  serviceTitle: "உங்கள் குடும்பத்திற்கான நடைமுறை உதவி.", janaza: "ஜனாஸா உதவி", janazaText: "உங்கள் குடும்பத்தின் தேவையை எமக்குத் தெரிவிக்கவும். சேவைக் கோரிக்கைப் படிவம் மூலம் சங்கத்தைத் தொடர்புகொள்ளலாம்.", transport: "போக்குவரத்து உதவி", transportText: "எமது சேவை வாகனங்களை அறிந்து போக்குவரத்து உதவியைக் கோரலாம்.", fleet: "எமது வாகனங்கள்", people: "சமூக ஆதரவு", peopleText: "சங்கத்தின் பொதுச் சேவைக்குப் பொறுப்பானவர்களை அறிந்துகொள்ளுங்கள்.", meet: "எமது குழுவை அறிக",
  leadership: "எமது தலைமைத்துவம்", leadershipTitle: "எமது சேவைக்குப் பொறுப்பானவர்கள்.", president: "தலைவர்", secretary: "செயலாளர்", treasurer: "பொருளாளர்", call: "அழைக்கவும்", callLeader: "சமூகத் தலைவரை அழைக்கவும்",
  latest: "அண்மைய செயற்பாடுகள்", journal: "சமூகச் செய்திகள்", activityTitle: "எமது சமூகப் பணியின் செய்திகள்.", allActivities: "அனைத்துச் செயற்பாடுகளும்", latestUpdate: "அண்மைய செய்தி", read: "செயற்பாட்டைப் பார்க்கவும்", more: "மேலும் வெளியிடப்பட்ட செயற்பாடுகள் இங்கு இடம்பெறும்.", emptyTitle: "வெளியிடப்பட்ட செயற்பாடுகள் இன்னும் இல்லை.", emptyText: "சமூகச் சேவைச் செய்திகள் வெளியிடப்படும்போது இங்கு இடம்பெறும்.", unavailable: "செயற்பாடுகள் தற்காலிகமாகக் கிடைக்கவில்லை.", retry: "பின்னர் மீண்டும் முயலவும் அல்லது செயற்பாடுகள் பக்கத்தைப் பார்க்கவும்.", noPhoto: "அனுமதிக்கப்பட்ட பொதுப் படம் இல்லை",
  guidance: "உதவி கோருதல்", guidanceTitle: "தெளிவான அடுத்த படி.", step1: "கோரிக்கையை அனுப்பவும்", step1Text: "தேவையான சேவையைத் தேர்ந்தெடுத்து உங்கள் தொடர்பு விவரங்களை வழங்கவும்.", step2: "கோரிக்கைக் குறியீட்டைச் சேமிக்கவும்", step2Text: "கோரிக்கையைச் சமர்ப்பித்த பின்னர் வழங்கப்படும் குறியீட்டைப் பாதுகாக்கவும்.", step3: "நிலையை அறியவும்", step3Text: "கோரிக்கைக் குறியீடு மற்றும் கைப்பேசி இலக்கம் மூலம் முன்னேற்றத்தை அறியலாம்.",
  support: "சங்கத்திற்கு ஆதரவளிக்கவும்", supportTitle: "எமது சேவை தொடர உதவுங்கள்.", supportText: "ஜனாஸா நலன்புரிச் சங்கத்தின் பணிக்கு எவ்வாறு ஆதரவளிக்கலாம் என்பதை அறியுங்கள்.", footerText: "காத்தான்குடி குடும்பங்களுக்குக் கண்ணியமான சேவை.", top: "மேலே செல்லவும்", source: "வசனத்தை வாசிக்கவும்", publicContent: "வெளியிடப்பட்ட சமூகச் செயற்பாடுகள்",
};

export function previewCopy(locale: Locale) { return locale === "ta" ? ta : en; }
export const quranVerse = "كُلُّ نَفْسٍ ذَائِقَةُ الْمَوْتِ";
export const quranTranslation = "Every soul will taste death.";
export const quranSource = "https://quran.com/en/ali-imran/185";
