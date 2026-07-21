export interface Bug {
  id?: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  category: string;
  status?: string;
  githubRepo?: string;
  gitIssueNumber?: number;
  githubCreator?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: { id: string; name: string; email: string };
  attachments?: BugAttachment[];
  reporterEmail?: string;
}

interface BugAttachment {
  id: number;
  filePath: string;
  fileType: string;
  bugId: string;
  createdAt?: string;
}

export interface BugStatusLog {
  id: number;
  status: string;
  comment?: string;
  changedAt: string;
  changedBy?: { id: string; name: string; email: string };
}
