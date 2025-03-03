import { requestMenuConfig } from "@/DataProviders/ConfigRepository";
import { AppConfig } from "@/Infrastructure/AppConfig";
import { FC } from "react";

import { Footer, Header, MenuContextProvider } from "variamos-components";

export const MainLayout: FC<any> = ({ children }) => {
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
