import {
  DISCARD_TEXTS,
  DiscardInputPrompt,
  hasUnsavedInput,
  pageText,
} from "@variamosple/variamos-components";
import type { FC } from "react";
import { Modal } from "react-bootstrap";
import { type BlockerFunction, useBlocker } from "react-router-dom";

// Going there drops the input on purpose: signing out, or signing in again
// once the loss was confirmed in the banner of an ended session
const LEAVES_ON_PURPOSE = new Set(["/login"]);

/**
 * Leaving a page that holds unsaved input, by a link of the menu, the back
 * button of the browser or any change of route, asks first, as closing a
 * form does (UX-08, ADR-0075). A change of the search or the tab of the
 * same page keeps it: it does not leave the page. Closing or reloading the
 * tab is asked by the browser (useUnsavedInput). Signing out from the menu
 * asks in the header (variamos-components 0.12.0).
 */
const shouldAskBeforeLeaving: BlockerFunction = ({
  currentLocation,
  nextLocation,
}) =>
  currentLocation.pathname !== nextLocation.pathname &&
  !LEAVES_ON_PURPOSE.has(nextLocation.pathname) &&
  // The global bug form of the header stays when the page changes
  hasUnsavedInput({ leavingPage: true });

/** Asks before a change of route drops unsaved input. */
export const LeaveGuard: FC = () => {
  const blocker = useBlocker(shouldAskBeforeLeaving);
  if (blocker.state !== "blocked") return null;
  return (
    <Modal
      show
      onHide={blocker.reset}
      centered
      aria-label={pageText(DISCARD_TEXTS.question)}
    >
      <Modal.Body>
        <DiscardInputPrompt
          onKeepEditing={blocker.reset}
          onDiscard={blocker.proceed}
        />
      </Modal.Body>
    </Modal>
  );
};
