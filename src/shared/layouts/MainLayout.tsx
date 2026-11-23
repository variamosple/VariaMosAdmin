import {
  DEFAULT_MAIN_CONTENT_ID,
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
          logoUrl={"./images/VariaMosLogo.webp"}
          logoAlt="VariaMos logo"
          signInUrl={AppConfig.LOGIN_URL}
          adminApiUrl={AppConfig.ADMIN_API_URL}
        />
      </MenuContextProvider>

      {/* Focused by the skip link of the header (ADM-N15) */}
      <main id={DEFAULT_MAIN_CONTENT_ID} tabIndex={-1}>
        {children}
      </main>

      <Footer />
    </>
  );
};
