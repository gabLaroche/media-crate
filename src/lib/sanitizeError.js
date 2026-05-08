// Maps known Supabase / Postgres error signatures to user-friendly strings.
// Accepts an Error, a Supabase error object, or a plain string.

const BY_CODE = {
  // Supabase Auth
  invalid_credentials: "Invalid email or password.",
  email_exists: "An account with this email already exists.",
  user_already_exists: "An account with this email already exists.",
  email_not_confirmed: "Please confirm your email address before signing in.",
  too_many_requests: "Too many attempts. Please wait and try again.",
  over_email_send_rate_limit: "Too many emails sent. Please wait and try again.",
  weak_password: "Password is too weak. Please choose a stronger one.",
  same_password: "New password must be different from your current password.",
  // Postgres
  "23505": "This value is already taken.",
  "23503": "This action can't be completed due to a linked record.",
  "42501": "You don't have permission to perform this action.",
  // PostgREST
  PGRST116: "Record not found.",
};

const BY_MESSAGE = [
  ["invalid login credentials", "Invalid email or password."],
  ["already registered", "An account with this email already exists."],
  ["email not confirmed", "Please confirm your email address before signing in."],
  ["storage quota exceeded", null], // keep the original — it's already user-friendly
];

export function sanitizeError(error) {
  if (!error) return "An unexpected error occurred.";

  const code = error.code ?? error.error_code ?? "";
  const message = String(error.message ?? error).toLowerCase();

  if (BY_CODE[code]) return BY_CODE[code];

  for (const [fragment, replacement] of BY_MESSAGE) {
    if (message.includes(fragment)) {
      // null replacement = pass through the original message
      return replacement ?? (error.message ?? String(error));
    }
  }

  return "An unexpected error occurred. Please try again.";
}
