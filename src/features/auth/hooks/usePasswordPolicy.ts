import { useEffect, useState } from "react";
import { getPasswordPolicy } from "../api/AuthRepository";
import {
  DEFAULT_PASSWORD_POLICY,
  describePasswordPolicy,
  isPasswordAllowed,
  type PasswordPolicy,
} from "../domain/PasswordPolicy";

/** The configured password policy, with a validate rule for the forms. */
export const usePasswordPolicy = () => {
  const [policy, setPolicy] = useState<PasswordPolicy>(DEFAULT_PASSWORD_POLICY);

  useEffect(() => {
    let active = true;
    // On failure the default rule stays: the server checks anyway
    getPasswordPolicy()
      .then((response) => {
        if (active && !response.errorCode && response.data) {
          setPolicy(response.data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const message = describePasswordPolicy(policy);
  return {
    policy,
    message,
    validate: (value: string) => isPasswordAllowed(policy, value) || message,
  };
};
