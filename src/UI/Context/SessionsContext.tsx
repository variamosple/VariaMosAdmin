import {
  getSessionInfo,
  requestLogout,
  requestSignIn,
  requestSignInAsGuest,
  requestSignUp,
} from "@/DataProviders/AuthRepository";
import { ResponseModel } from "@/Domain/Core/Entity/ResponseModel";
import { Credentials } from "@/Domain/User/Entity/Credentials";
import { User } from "@/Domain/User/Entity/User";
import { UserRegistration } from "@/Domain/User/Entity/UserRegistration";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePageVisibility } from "../Hooks/usePageVisibility";

interface SessionContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (credentials: Credentials) => Promise<string | undefined>;
  signInAsGuest: () => Promise<string | undefined>;
  signUp: (
    registration: UserRegistration
  ) => Promise<ResponseModel<unknown> | null>;
  logout: () => void;
}

const guestIdKey = "guestId";

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isAuthenticated = !!user;
  const isPageActive = usePageVisibility();

  useEffect(() => {
    setIsLoading(true);
    getSessionInfo()
      .then((result) => {
        if (!result?.errorCode) {
          setUser(result?.data ?? null);
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (isAuthenticated && isPageActive) {
      const requestSessionInfo = () => {
        getSessionInfo()
          .then((result) => {
            if (!result?.errorCode) {
              setUser(result?.data ?? null);
            } else {
              setUser(null);
            }
          })
          .catch(() => {
            setUser(null);
          });
      };

      requestSessionInfo();

      const interval = setInterval(() => {
        requestSessionInfo();
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isPageActive]);

  const signIn = (credentials: Credentials) => {
    setIsLoading(true);

    return requestSignIn(credentials)
      .then((response) => {
        if (response?.errorCode) {
          return response.message;
        }

        return getSessionInfo()
          .then((result) => {
            if (!result?.errorCode) {
              setUser(result?.data ?? null);
            } else {
              setUser(null);
            }
            return "";
          })
          .catch(() => {
            setUser(null);
            return "Sign in error.";
          });
      })
      .finally(() => setIsLoading(false));
  };

  const signUp = (registration: UserRegistration) => {
    setIsLoading(true);

    return requestSignUp(registration).finally(() => setIsLoading(false));
  };

  const logout = () => {
    requestLogout().then(() => {
      setUser(null);
    });
  };

  const signInAsGuest = () => {
    setIsLoading(true);

    const guestId = localStorage.getItem(guestIdKey);

    return requestSignInAsGuest(guestId)
      .then((response) => {
        if (response?.errorCode) {
          return response.message;
        }

        localStorage.setItem(guestIdKey, response?.data || "");

        return getSessionInfo()
          .then((result) => {
            if (!result?.errorCode) {
              setUser(result?.data ?? null);
            } else {
              setUser(null);
            }
            return "";
          })
          .catch(() => {
            setUser(null);
            return "Sign in error.";
          });
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <SessionContext.Provider
      value={{
        user,
        isAuthenticated,
        logout,
        isLoading,
        signIn,
        signUp,
        signInAsGuest,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
