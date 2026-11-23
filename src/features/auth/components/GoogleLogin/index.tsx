import { type FC, useEffect, useRef } from "react";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { loadGoogleSignInScript } from "./googleSignInScript";

/**
 * Height of the "large" Google button, kept from the first render: the
 * script is added by this component, so the button appears after the form,
 * and its arrival pushed the centered form up under a click on "Sign in".
 */
const GOOGLE_BUTTON_HEIGHT_PX = 40;

interface GoogleLoginProps {
  text?: "signin_with" | "signup_with";
}

export const GoogleLogin: FC<GoogleLoginProps> = ({ text = "signin_with" }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      const google = window.google;
      if (!google) return;

      const element = containerRef.current;
      if (!element) return;

      google.accounts.id.initialize({
        client_id: AppConfig.GOOGLE.CLIENT_ID,
        context: "signin",
        ux_mode: "redirect",
        login_uri: AppConfig.GOOGLE.REDIRECT_URI,
      });

      google.accounts.id.renderButton(element, {
        theme: "outline",
        type: "standard",
        text,
        shape: "rectangular",
        size: "large",
        width: "300",
        locale: "en",
        logo_alignment: "left",
      });
    };

    if (window.google?.accounts?.id) {
      initializeGoogleSignIn();
      return;
    }
    // The Google script is added by the first page that shows the button;
    // wait for it while the button is shown, and stop when leaving the page,
    // or it would check forever when the script never loads (blocked, offline)
    loadGoogleSignInScript();
    const intervalId = setInterval(() => {
      if (window.google?.accounts?.id) {
        initializeGoogleSignIn();
        clearInterval(intervalId);
      }
    }, 100);
    return () => clearInterval(intervalId);
  }, [text]);
  return (
    <div
      ref={containerRef}
      data-testid="google-signin-container"
      className="g_id_signin"
      data-locale="en"
      style={{ colorScheme: "normal", minHeight: GOOGLE_BUTTON_HEIGHT_PX }}
    />
  );
};
