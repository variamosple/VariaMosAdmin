import { type SubmitEvent, useState } from "react";
import type { Bug, BugUserRef } from "../domain/Bug";

/** What the details of a bug use from the bug list. */
export interface BugDetailsActions {
  fetchNotes: (bugId: string) => Promise<void>;
  handleAddNote: (bugId: string, body: string) => Promise<string | null>;
  handleSetAssignees: (
    bugId: string,
    userIds: string[],
  ) => Promise<{ assignees: BugUserRef[] } | { error: string }>;
  handleChangeStatus: (
    bugId: string,
    status: string,
    comment?: string,
  ) => Promise<string | null>;
}

/** The comment being written on the bug shown. */
export interface BugNoteDraft {
  body: string;
  setBody: (body: string) => void;
  isSubmitting: boolean;
  error: string | null;
  submit: (e: SubmitEvent<HTMLFormElement>) => Promise<void>;
}

/**
 * The bug shown in the details window, its comment draft, and the changes
 * made from it (assignees, status), which the window shows at once.
 */
export const useBugDetails = (actions: BugDetailsActions) => {
  const { fetchNotes, handleAddNote, handleSetAssignees, handleChangeStatus } =
    actions;
  const [bug, setBug] = useState<Bug | null>(null);
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = (shown: Bug) => {
    setBug(shown);
    setError(null);
    if (shown?.id) {
      void fetchNotes(shown.id);
    }
  };

  const close = () => setBug(null);

  const submit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!body.trim() || !bug?.id) return;
    setIsSubmitting(true);
    setError(null);
    const failure = await handleAddNote(bug.id, body);
    if (failure) {
      setError(failure);
    } else {
      setBody("");
    }
    setIsSubmitting(false);
  };

  // The API notes both changes in the timeline, read again after them
  const saveAssignees = async (
    shown: Bug,
    bugId: string,
    userIds: string[],
  ): Promise<string | null> => {
    const result = await handleSetAssignees(bugId, userIds);
    if ("error" in result) return result.error;
    setBug({ ...shown, assignedAdmins: result.assignees });
    void fetchNotes(bugId);
    return null;
  };

  const changeStatus = async (
    shown: Bug,
    bugId: string,
    change: { status: string; comment?: string },
  ): Promise<string | null> => {
    const failure = await handleChangeStatus(
      bugId,
      change.status,
      change.comment,
    );
    if (!failure) {
      setBug({ ...shown, status: change.status });
      void fetchNotes(bugId);
    }
    return failure;
  };

  const draft: BugNoteDraft = { body, setBody, isSubmitting, error, submit };

  return { bug, open, close, saveAssignees, changeStatus, draft };
};
