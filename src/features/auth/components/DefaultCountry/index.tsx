import { useSession } from "@variamosple/variamos-components";
import { type FC, useEffect } from "react";
import { offerDefaultCountry } from "../../api/AuthRepository";

// Accounts already offered a country since the page was loaded
const offered = new Set<string>();

/** Forgets the accounts offered a country, for the tests. */
export const resetOfferedCountries = () => offered.clear();

/**
 * Offers the country of the browser's time zone to a signed-in account,
 * once per page load (EV-90). The server keeps a country already chosen.
 * Draws nothing. A guest, without the right to change its account, is not
 * offered one.
 */
export const DefaultCountry: FC = () => {
  const { user } = useSession();
  const userId = user?.id;
  const allowed = Boolean(user?.permissions?.includes("my-account::update"));

  useEffect(() => {
    if (!userId || !allowed || offered.has(userId)) return;
    offered.add(userId);
    void offerDefaultCountry();
  }, [userId, allowed]);

  return null;
};
