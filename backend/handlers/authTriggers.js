// backend/handlers/authTriggers.js
// Auto-confirm new users so no email/SMS verification is needed.
export const preSignUp = async (event) => {
  // Confirm the user account automatically
  event.response.autoConfirmUser = true;

  // If you still collect email, mark it verified so sign-in works with email
  event.response.autoVerifyEmail = true;

  // Leave phone unverified unless you collect it
  event.response.autoVerifyPhone = false;

  return event;
};
