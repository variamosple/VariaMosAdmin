import { FC, useEffect } from "react";

interface GoogleLoginProps {
  text?: "signin_with" | "signup_with";
}

const CLIENT_ID =
  "825336741359-ot8v21gog11q4i9fi12ohueh0na2qgs2.apps.googleusercontent.com";
const REDIRECT_URI = "http://localhost:4000/auth/google/callback";

export const GoogleLogin: FC<GoogleLoginProps> = ({ text = "signin_with" }) => {
  useEffect(() => {
    const initializeGoogleSignIn = () => {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        context: "signin",
        ux_mode: "redirect",
        login_uri: REDIRECT_URI,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("g_id_signin"),
        {
          theme: "outline",
          type: "standard",
          text,
          shape: "rectangular",
          size: "large",
          width: "300",
          locale: "en",
          logo_alignment: "left",
        }
      );
    };

    if (window.google) {
      initializeGoogleSignIn();
    } else {
      const intervalId = setInterval(() => {
        if (window.google) {
          initializeGoogleSignIn();
          clearInterval(intervalId);
        }
      }, 100);
    }
  }, [text]);
  return (
    <div
      id="g_id_signin"
      className="g_id_signin"
      data-locale="en"
      style={{ colorScheme: "normal" }}
    ></div>
  );
};
