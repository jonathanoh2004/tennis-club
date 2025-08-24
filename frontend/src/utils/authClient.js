// frontend/src/utils/authClient.js
import { Amplify } from "aws-amplify";
import {
  signUp,
  signIn,
  signOut,
  fetchAuthSession,
  getCurrentUser,
} from "aws-amplify/auth";

const region = import.meta.env.VITE_COGNITO_REGION || "us-west-2";
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID;

// Quick sanity check in dev
if (!userPoolId || !userPoolClientId) {
  // Helpful console warning; avoids crashing UI
  console.warn(
    "[auth] Missing Cognito config. Check VITE_COGNITO_USER_POOL_ID / VITE_COGNITO_CLIENT_ID in frontend/.env"
  );
}

// Configure for Amplify v6 (primary) + v5 fallback keys for safety
Amplify.configure({
  Auth: {
    // v6 style
    Cognito: {
      userPoolId,
      userPoolClientId,
      region,
    },
    // v5/v4 compatibility (harmless if unused)
    region,
    userPoolId,
    userPoolWebClientId: userPoolClientId,
    mandatorySignIn: false,
  },
});

export const authApi = {
  signUp: ({ username, password, email }) =>
    signUp({
      username,
      password,
      options: { userAttributes: { email } },
    }),
  signIn: ({ username, password }) => signIn({ username, password }),
  signOut: () => signOut(),
  getSession: () => fetchAuthSession(),
  getUser: () => getCurrentUser(),
  getIdToken: async () => {
    const s = await fetchAuthSession();
    return s.tokens?.idToken?.toString() || "";
  },
};
