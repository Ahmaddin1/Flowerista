// ---------------------------------------------------------------------------
// Flowerista — shared checkout field validation (ISOMORPHIC)
// ---------------------------------------------------------------------------
// Single source of truth for the checkout FORMAT rules (phone, name, postal
// code, email). This module is imported by BOTH:
//
//   • the checkout UI  → src/app/checkout/page.jsx        (runs in the browser)
//   • the order route  → src/app/api/orders/create/route.js (runs on the server)
//
// Keeping the regexes here guarantees the client and the server enforce the
// EXACT SAME format logic — they can never silently drift apart.
//
// ⚠️ TRUST BOUNDARY — READ THIS:
// The fact that the browser imports these helpers does NOT make client-side
// validation a security control. Anything running in the browser can be
// bypassed (curl, Postman, a script hitting /api/orders/create directly). The
// client-side use of this module is PRESENTATION ONLY — it exists to give real
// customers fast, friendly feedback. The API route re-runs every check in this
// module on every request and treats the request body as hostile. If you change
// a rule here, both layers pick it up, but the server remains the only place
// where the rule is actually *enforced*.
//
// This module must stay dependency-free and free of any server-only imports
// (no mongoose, no next/*, no node built-ins) so it is safe to bundle into the
// client component.
// ---------------------------------------------------------------------------

// Length guards ------------------------------------------------------------
// Used both as client-side maxlength UX guards and as server-side hard caps.
export const NAME_MAX_LENGTH = 50;
export const EMAIL_MAX_LENGTH = 254; // RFC 5321 practical maximum
export const PHONE_MAX_LENGTH = 15; // longest accepted input is "0300-1234567" (12)
export const POSTAL_CODE_MAX_LENGTH = 6; // valid PK codes are exactly 5; +1 slack

// Format rules -------------------------------------------------------------

// NAME — DECISION (PROMPT 1): letters only, but spaces, hyphens and apostrophes
// ARE allowed *between* letter groups so real names are not rejected:
//   "O'Brien" (straight ' and typographic ’), "Anne-Marie", "de la Cruz".
// We accept any Unicode letter (\p{L}) plus combining marks (\p{M}) so accented
// names like "José" or "Zoë" pass too. Digits and other symbols are rejected,
// as are leading/trailing separators and doubled separators.
export const NAME_REGEX = /^[\p{L}\p{M}]+(?:[ \-'’‐][\p{L}\p{M}]+)*$/u;

// PHONE — exactly one of the three accepted Pakistani formats (PROMPT 1/2):
//   03XXXXXXXXX    → 11 digits starting "03"        e.g. 03001234567
//   92XXXXXXXXXX   → 12 digits starting "92"        e.g. 923001234567
//   03XX-XXXXXXX   → single dash after the 4th digit e.g. 0300-1234567
// Anything else (spaces, "+", extra dashes, wrong digit counts) is rejected.
export const PHONE_REGEX = /^(?:03\d{9}|92\d{10}|03\d{2}-\d{7})$/;

// POSTAL CODE — DECISION (PROMPT 1): exactly 5 digits. The site ships to
// Pakistan only (checkout COUNTRIES list = ["Pakistan"]), and Pakistani postal
// codes are 5 digits, so we lock to exactly 5. Revisit this if international
// shipping is ever enabled.
export const POSTAL_CODE_REGEX = /^\d{5}$/;

// EMAIL — standard name@domain.tld: exactly one "@", a non-empty local part, a
// domain containing at least one dot, and a letters-only TLD of length >= 2.
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

// User-facing messages (identical wording on client and server). ----------
export const VALIDATION_MESSAGES = {
  name: "Please enter a valid name.",
  phone: "Please enter a valid phone number.",
  postalCode: "Please enter a valid postal code.",
  email: "Please enter a valid email address.",
};

function asString(value) {
  return typeof value === "string" ? value : "";
}

// Predicates ---------------------------------------------------------------
// Each trims first (leading/trailing whitespace is never significant) and
// enforces the length guard before testing the format.

export function isValidName(value) {
  const trimmed = asString(value).trim();
  return (
    trimmed.length > 0 &&
    trimmed.length <= NAME_MAX_LENGTH &&
    NAME_REGEX.test(trimmed)
  );
}

export function isValidPhone(value) {
  const trimmed = asString(value).trim();
  return (
    trimmed.length > 0 &&
    trimmed.length <= PHONE_MAX_LENGTH &&
    PHONE_REGEX.test(trimmed)
  );
}

export function isValidEmail(value) {
  const trimmed = asString(value).trim();
  return (
    trimmed.length > 0 &&
    trimmed.length <= EMAIL_MAX_LENGTH &&
    EMAIL_REGEX.test(trimmed)
  );
}

// Postal code is OPTIONAL on this checkout form. An empty value is therefore
// VALID; a provided value must be exactly 5 digits. Use
// isPostalCodePresentAndValid() when you specifically need "present AND valid".
export function isValidPostalCode(value) {
  const trimmed = asString(value).trim();
  if (trimmed === "") {
    return true;
  }
  return trimmed.length <= POSTAL_CODE_MAX_LENGTH && POSTAL_CODE_REGEX.test(trimmed);
}

export function isPostalCodePresentAndValid(value) {
  const trimmed = asString(value).trim();
  return POSTAL_CODE_REGEX.test(trimmed);
}

// Normalizers --------------------------------------------------------------

// Lowercase + trim, so "  Name@Example.COM " and "name@example.com" are stored
// identically (case-insensitive domains/locals in practice for this store).
export function normalizeEmail(value) {
  return asString(value).trim().toLowerCase();
}

// Collapse any accepted phone format to the canonical 11-digit local form
// "03XXXXXXXXX". Strips dashes/spaces/every non-digit, then converts the
// 12-digit "92XXXXXXXXXX" international form to the local "0..." form. The
// result still satisfies PHONE_REGEX, and the WhatsApp helper re-derives the
// "92..." wa.me form from it regardless.
export function canonicalizePhone(value) {
  const digits = asString(value).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("92")) {
    return `0${digits.slice(2)}`;
  }
  return digits;
}

// Convenience: given a field name + raw value, return the user-facing error
// message ("" when the field is valid). Shared so the client and server report
// identical wording. `required` distinguishes empty-but-optional (postal code)
// from empty-but-required.
export function getFieldErrorMessage(field, value) {
  switch (field) {
    case "email":
      return isValidEmail(value) ? "" : VALIDATION_MESSAGES.email;
    case "firstName":
    case "lastName":
    case "name":
      return isValidName(value) ? "" : VALIDATION_MESSAGES.name;
    case "phone":
    case "phoneNumber":
      return isValidPhone(value) ? "" : VALIDATION_MESSAGES.phone;
    case "postalCode":
      return isValidPostalCode(value) ? "" : VALIDATION_MESSAGES.postalCode;
    default:
      return "";
  }
}
