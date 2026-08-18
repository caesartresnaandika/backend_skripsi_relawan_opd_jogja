// src/utils/regex.ts

export const REGEX_PATTERNS = {
  ALAMAT_ANGKA_SAJA: /^\d+$/,

  // ALAMAT: Hanya boleh huruf, angka, spasi, dan .,/#-
  ALAMAT_VALID: /^[a-zA-Z0-9\s.,\/#-]+$/,

  // Mengizinkan angka, tanda tambah (+), spasi (\s), dan strip (-) untuk pengecekan karakter ilegal
  HAS_ILLEGAL_SPECIAL_CHAR: /[^0-9+\s-]/,

  // Helper deteksi error spesifik untuk nomor HP
  HAS_LETTERS: /[a-zA-Z]/,

  // Nama OPD hanya boleh huruf dan spasi (untuk validasi form OPD)
  NAMA_OPD: /^[a-zA-Z\s]+$/,

  // NAMA RELAWAN / KADER / PIC / USER: Hanya huruf, spasi, koma(,), titik(.), petik satu('), dan strip(-)
  // Mengakomodasi nama dengan tanda petik (misal: Syafi'i) dan gelar (misal: M.Pd.)
  NAMA_RELAWAN: /^[a-zA-Z\s.,'-]+$/,

  // NIK: Tepat 16 digit angka murni
  NIK: /^\d{16}$/,

  // NOMOR TELEPON: Diawali +628 atau 08, diikuti angka, total panjang 9-13 digit
  NO_HP: /^(?:\+62|0)8[0-9]{7,11}$/,
};

/**
 * Membersihkan nomor HP dari spasi dan tanda minus
 */
export const cleanPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return '';
  return String(phone).replace(/[\s-]/g, '').trim();
};

/**
 * Validasi nomor HP / kontak
 */
export const isValidPhoneNumber = (phone: string | null | undefined): boolean => {
  if (!phone) return false;
  const cleaned = cleanPhoneNumber(phone);
  return REGEX_PATTERNS.NO_HP.test(cleaned);
};

/**
 * Validasi nama relawan / kader / PIC / user
 */
export const isValidName = (name: string | null | undefined): boolean => {
  if (!name) return false;
  return REGEX_PATTERNS.NAMA_RELAWAN.test(name.trim());
};

/**
 * Validasi nama OPD
 */
export const isValidOpdName = (name: string | null | undefined): boolean => {
  if (!name) return false;
  return REGEX_PATTERNS.NAMA_OPD.test(name.trim());
};

/**
 * Validasi NIK
 */
export const isValidNik = (nik: string | null | undefined): boolean => {
  if (!nik) return false;
  return REGEX_PATTERNS.NIK.test(String(nik).trim());
};
