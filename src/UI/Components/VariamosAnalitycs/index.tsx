import { registerVisit } from "@/DataProviders/VisitsRepository";
import { FC, useEffect } from "react";
import { matchRoutes, useLocation } from "react-router-dom";

export const VariamosAnalitycsComponent: FC<any> = ({ routes }) => {
  const location = useLocation();

  useEffect(() => {
    const trackVisit = async () => {
      const matchedRoutes = matchRoutes(routes, location.pathname);

      if (!matchedRoutes?.length) {
        return;
      }

      try {
        const id = matchedRoutes.find((route) => route.route.id)?.route.id;

        if (id) {
          registerVisit(id).then(() => {});
        }
      } catch (error) {
        console.error("Error tracking page visit:", error);
      }
    };

    trackVisit();
  }, [location, routes]);

  return null;
};
