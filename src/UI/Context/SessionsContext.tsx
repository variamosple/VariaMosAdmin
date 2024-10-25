import {
  getSessionInfo,
  requestLogout,
  requestSignIn,
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
  signUp: (
    registration: UserRegistration
  ) => Promise<ResponseModel<unknown> | null>;
  logout: () => void;
}

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
        setUser(result ?? null);
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
            setUser(result ?? null);
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
            setUser(result ?? null);
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

  return (
    <SessionContext.Provider
      value={{ user, isAuthenticated, logout, isLoading, signIn, signUp }}
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
