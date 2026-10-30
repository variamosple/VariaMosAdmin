import { type FC, useEffect } from "react";
import { AppConfig } from "@/shared/infrastructure/AppConfig";

interface GoogleLoginProps {
  text?: "signin_with" | "signup_with";
}

export const GoogleLogin: FC<GoogleLoginProps> = ({ text = "signin_with" }) => {
  useEffect(() => {
    const initializeGoogleSignIn = () => {
      const google = window.google;
      if (!google) return;

      const element = document.getElementById("g_id_signin");
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
    // The Google script loads on its own; wait for it while the button is
    // shown, and stop when leaving the page, or it would check forever when
    // the script never loads (blocked, offline)
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
      id="g_id_signin"
      data-testid="google-signin-container"
      className="g_id_signin"
      data-locale="en"
      style={{ colorScheme: "normal" }}
    ></div>
  );
};
