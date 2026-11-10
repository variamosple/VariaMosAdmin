import type { ComponentProps, FC, ReactNode } from "react";
import { Button } from "react-bootstrap";

export type IconButtonProps = Omit<
  ComponentProps<typeof Button>,
  "children" | "title" | "aria-label"
> & {
  /** Names the button for screen readers and shows as its tooltip */
  label: string;
  icon: ReactNode;
};

/**
 * A button that shows only an icon. The label is required, so that no such
 * button is left without a name (UX-17); the icon itself is hidden from
 * screen readers.
 */
export const IconButton: FC<IconButtonProps> = ({ label, icon, ...props }) => (
  <Button {...props} aria-label={label} title={label}>
    <span aria-hidden="true">{icon}</span>
  </Button>
);
