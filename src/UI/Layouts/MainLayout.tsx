import { FC } from "react";

import { Footer, Header, Menu, MenuContextProvider } from "variamos-components";

const MENU: Menu = {
  items: [
    {
      title: "Home",
      type: "link",
      link: "https://variamos.com/home/",
      target: "_blank",
    },
    {
      title: "Admin",
      type: "link",
      link: "http://localhost:8081/variamos_admin/",
      allowedPermissions: [
        "users::query",
        "roles::query",
        "permissions::query",
        "metrics::query",
        "micro-services",
      ],
    },
    {
      title: "Languages",
      type: "link",
      link: "http://localhost:8081/variamos_languages/",
    },
    {
      title: "Wiki",
      type: "link",
      link: "https://github.com/variamosple/VariaMosPLE/wiki",
      target: "_blank",
    },
  ],
  subMenu: [
    {
      path: "/variamos_admin/",
      items: [
        {
          title: "Users",
          link: "/users",
          allowedPermissions: ["users::query"],
        },
        {
          title: "Roles",
          link: "/roles",
          allowedPermissions: ["roles::query"],
        },
        {
          title: "Permission",
          link: "/permissions",
          allowedPermissions: ["permissions::query"],
        },
        {
          title: "Metrics",
          link: "/metrics",
          allowedPermissions: ["metrics::query"],
        },
        {
          title: "Monitoring",
          link: "/monitoring",
          allowedPermissions: ["micro-services::query"],
        },
      ],
    },
  ],
  options: [
    {
      title: "My account",
      link: "http://localhost:8081/variamos_admin/#/my-account",
    },
    {
      title: "Report a problem",
      link: `https://github.com/variamosple/VariaMosLanguages/issues/new`,
      target: "_blank",
      allowedPermissions: ["languages::create", "product-lines::create"],
    },
    {
      title: "Issues",
      link: `https://github.com/variamosple/VariaMosLanguages/issues/`,
      target: "_blank",
      allowedPermissions: ["languages::create", "product-lines::create"],
    },
  ],
};

export const MainLayout: FC<any> = ({ children }) => {
  return (
    <>
      <MenuContextProvider menu={MENU}>
        <Header logoUrl={"./images/VariaMosLogo.png"} logoAlt="VariaMos logo" />
      </MenuContextProvider>

      {children}

      <Footer />
    </>
  );
};
