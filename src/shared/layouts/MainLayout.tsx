import {
  Footer,
  Header,
  MenuContextProvider,
} from "@variamosple/variamos-components";
import type { FC, ReactNode } from "react";
import { requestMenuConfig } from "@/shared/api/ConfigRepository";
import { AppConfig } from "@/shared/infrastructure/AppConfig";

export const MainLayout: FC<{ children?: ReactNode }> = ({ children }) => {
  return (
    <>
      <MenuContextProvider requestMenu={requestMenuConfig}>
        <Header
          logoUrl={"./images/VariaMosLogo.png"}
          logoAlt="VariaMos logo"
          signInUrl={AppConfig.LOGIN_URL}
        />
      </MenuContextProvider>

      {children}

      <Footer />
    </>
  );
};
