export const CATEGORIES = [
  { value: "COMPUTERS", label: "Computers" },
  { value: "PROJECTORS", label: "Projectors" },
  { value: "FANS", label: "Fans" },
  { value: "LIGHTS", label: "Lights" },
  { value: "WIFI", label: "Wi-Fi" },
  { value: "OTHER", label: "Other" },
] as const;

// Placeholder buildings: replace with your real campus buildings later.
export const BUILDINGS = [
  "Main Academic Block",
  "Science Block",
  "Computer Science Block",
  "Library",
  "Administration Block",
  "Auditorium",
  "Cafeteria",
] as const;

export const STATUSES = [
  { value: "PENDING", label: "Pending", classes: "bg-amber-100 text-amber-900 ring-amber-300" },
  { value: "IN_PROGRESS", label: "In Progress", classes: "bg-sky-100 text-sky-900 ring-sky-300" },
  { value: "RESOLVED", label: "Resolved", classes: "bg-emerald-100 text-emerald-900 ring-emerald-300" },
] as const;

export const MAX_IMAGES = 3;
export const MAX_ORIGINAL_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB, checked before compression
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const COMPRESSION_TARGET_MB = 1;
export const COMPRESSION_MAX_DIMENSION = 1920;
export const MAX_UPLOAD_IMAGE_BYTES = Math.floor(1.2 * 1024 * 1024);
export const MAX_REQUEST_BYTES = 4 * 1024 * 1024;
export const SIGNED_URL_SECONDS = 300;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];
export type StatusValue = (typeof STATUSES)[number]["value"];

// sessionStorage key used to pass the one-time ticket ID and token from the form to the success page.
export const CREDENTIALS_STORAGE_KEY = "campus-helpdesk:credentials";
