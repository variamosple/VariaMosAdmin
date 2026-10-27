import * as z from "zod/mini";
import { textOrEmpty } from "@/shared/api/schemas";
import type { Bug, BugAttachment, BugUserRef, RawBugNote } from "../domain/Bug";
import { BUG_PRIORITIES } from "../domain/BugPriority";

// Bug reports as variamos_ms_admin serializes them (EV-97 phase 2). The
// name of an account may be NULL in the database; the component and the
// category are free text in older reports

const userRefSchema: z.ZodMiniType<BugUserRef> = z.looseObject({
  id: z.string(),
  name: textOrEmpty,
});

export const userRefsSchema = z.array(userRefSchema);

export const attachmentSchema: z.ZodMiniType<BugAttachment> = z.looseObject({
  id: z.number(),
  filePath: z.string(),
  fileType: z.string(),
  bugId: z.string(),
  createdAt: z.optional(z.string()),
});

const bugSchema: z.ZodMiniType<Bug> = z.looseObject({
  id: z.optional(z.string()),
  title: z.string(),
  description: z.string(),
  priority: z.enum(BUG_PRIORITIES),
  // Left out by the server when there is none
  category: z.pipe(
    z.optional(z.string()),
    z.transform((value) => value ?? ""),
  ),
  component: z.optional(z.string()),
  status: z.optional(z.string()),
  githubRepo: z.optional(z.string()),
  gitIssueNumber: z.optional(z.number()),
  githubCreator: z.optional(z.string()),
  createdAt: z.optional(z.string()),
  updatedAt: z.optional(z.string()),
  createdBy: z.optional(
    z.looseObject({
      id: z.string(),
      name: textOrEmpty,
      email: z.optional(z.string()),
    }),
  ),
  attachments: z.optional(z.array(attachmentSchema)),
  reporterEmail: z.optional(z.string()),
  assignedAdmins: z.optional(userRefsSchema),
});

export const bugsSchema = z.array(bugSchema);

export const textsSchema = z.array(z.string());

export const notesSchema: z.ZodMiniType<RawBugNote[]> = z.array(
  z.looseObject({
    id: z.number(),
    body: z.string(),
    createdAt: z.string(),
    author: z.optional(z.looseObject({ name: z.string() })),
  }),
);
