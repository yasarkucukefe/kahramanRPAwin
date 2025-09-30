const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf"
];
const MAX_AI_PROCESS = 10; // Maximum AI process count per user per file

const harcama_kalemleri = {
  e0: "Harcama Türü:",
  e1: "Yemek",
  e2: "Akaryakıt",
  e3: "Ulaşım",
  e4: "Demirbaş",
  e100: "Diğer"
}

const MAX_RCP_REVISION = 20;

const yuzdelik_oranlar = [100, 70, 50, 0]

// Language
const la_ng = {};

la_ng["failed_uploads"] = "Yüklenemeyen Dosyalar (dosya türü ve boyutu nedeniyle):";