"use client";

export function LoginButton() {
  const handleLogin = () => {
    // Navigate to the backend login via the frontend proxy.
    // The backend returns a 302 redirect to the OIDC provider.
    window.location.href = "/api/auth/login";
  };

  return (
    <button
      onClick={handleLogin}
      className="inline-flex items-center justify-center rounded-md bg-[var(--primary)] px-6 py-3 text-base font-medium text-[var(--primary-foreground)] shadow hover:opacity-90 transition-opacity"
    >
      Sign in with SSO
    </button>
  );
}
