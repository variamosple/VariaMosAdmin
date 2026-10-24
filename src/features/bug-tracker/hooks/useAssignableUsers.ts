import { useEffect, useState } from "react";
import { queryAssignableUsers } from "../api/BugRepository";
import type { BugUserRef } from "../domain/Bug";

// Administrators a bug can be assigned to; the API answers only to those
// who may assign (bugs::update), so nothing is asked without it
export const useAssignableUsers = (enabled: boolean): BugUserRef[] => {
  const [users, setUsers] = useState<BugUserRef[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    queryAssignableUsers().then((res) => {
      if (active && !res.errorCode) setUsers(res.data ?? []);
    });
    return () => {
      active = false;
    };
  }, [enabled]);

  return enabled ? users : [];
};
