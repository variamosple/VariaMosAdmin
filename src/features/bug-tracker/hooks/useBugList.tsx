import type { ResponseModel } from "@variamosple/variamos-components";
import { useCallback, useEffect, useState } from "react";
import {
  addBugNote,
  createBug,
  queryBugNotes,
  queryBugRepos,
  queryBugs,
  queryCategories,
  queryLocalBugs,
  rejectLocalBug,
  restoreLocalBug,
  setBugAssignees,
  syncBugs,
  updateBugStatus,
} from "../api/BugRepository";
import type { Bug, BugStatusLog, BugUserRef, RawBugNote } from "../domain/Bug";
import type { BugFilter } from "../domain/BugFilter";
import type { BugPriority } from "../domain/BugPriority";

export const BUG_PAGE_SIZE = 20;

export const useBugList = () => {
  // 1. States for data
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [repos, setRepos] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Load failures are kept apart from action failures: the tab shows an
  // error state instead of the list of another tab or filter (UX-10)
  const [loadError, setLoadError] = useState<string | null>(null);
  // Creation failures are shown in the form, which stays open (UX-08)
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"github" | "local" | "trash">(
    "github",
  );
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const totalPages = Math.max(1, Math.ceil(totalCount / BUG_PAGE_SIZE));

  // Bug Notes States
  const [notes, setNotes] = useState<BugStatusLog[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState<boolean>(false);

  // 2. State for filtering
  const [filter, setFilter] = useState<BugFilter>({
    repo: "",
    status: "",
    priority: "",
    search: "",
  });

  // Fetch repos and categories on mount
  useEffect(() => {
    queryBugRepos().then((res) => {
      if (!res.errorCode) {
        setRepos(res.data || []);
      }
    });
    queryCategories().then((res) => {
      if (!res.errorCode) {
        setCategories(res.data || []);
      }
    });
  }, []);

  // Reset filters when changing tabs
  useEffect(() => {
    setFilter({
      repo: "",
      status: "",
      priority: "",
      search: "",
    });
  }, []);

  // 3. State for the creation modal
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 4. Function to load bugs (triggered on mount and filter changes)
  const fetchBugs = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    const page = { pageNumber, pageSize: BUG_PAGE_SIZE };
    let response: ResponseModel<Bug[]>;
    if (activeTab === "github") {
      response = await queryBugs({ ...filter, ...page });
    } else {
      const status = activeTab === "local" ? "pending" : "rejected";
      response = await queryLocalBugs({ ...filter, ...page, status });
    }

    if (response.errorCode) {
      setBugs([]);
      setLoadError(response.message || "Failed to load bugs");
    } else {
      const data = response.data || [];
      // A server without paging sends every bug and no count
      const count = response.totalCount ?? data.length;
      setBugs(data);
      setTotalCount(count);
      // The last bugs of the page were moved away: show the new last page
      const lastPage = Math.max(1, Math.ceil(count / BUG_PAGE_SIZE));
      if (pageNumber > lastPage) setPageNumber(lastPage);
    }
    setIsLoading(false);
  }, [filter, activeTab, pageNumber]);

  // Trigger loading
  useEffect(() => {
    fetchBugs();
  }, [fetchBugs]);

  // Bug Notes Functions
  const fetchNotes = useCallback(async (bugId: string) => {
    setIsLoadingNotes(true);
    setError(null);
    const response = await queryBugNotes(bugId);
    if (response.errorCode) {
      setError(response.message || "Failed to load bug notes");
    } else {
      const mapped = (response.data || []).map((n: RawBugNote) => ({
        id: n.id,
        status: "",
        comment: n.body || "",
        changedAt: n.createdAt,
        changedBy: n.author?.name
          ? { id: "", name: n.author.name, email: "" }
          : undefined,
      }));
      setNotes(mapped);
    }
    setIsLoadingNotes(false);
  }, []);

  const handleAddNote = async (bugId: string, body: string) => {
    setError(null);
    const response = await addBugNote(bugId, body);
    if (response.errorCode) {
      setError(response.message || "Failed to add bug note");
      return false;
    }
    await fetchNotes(bugId);
    return true;
  };

  // 5. Function to submit the creation of a bug
  const handleCreateBug = async (
    title: string,
    description: string,
    priority: BugPriority,
    category: string,
    githubRepo?: string,
    file?: File,
    component?: string,
  ) => {
    setIsSubmitting(true);
    setCreateError(null);
    const response = await createBug(
      title,
      description,
      priority,
      category,
      githubRepo,
      file,
      component,
    );

    if (response.errorCode) {
      setCreateError(response.message || "Failed to create bug");
      setIsSubmitting(false);
      return false; // Indicates creation failure
    }

    setShowCreate(false);
    setIsSubmitting(false);
    fetchBugs(); // Refresh list
    return true; // Indicates success
  };

  // 6. Function to trigger manual sync with GitHub
  const handleSyncBugs = async () => {
    setIsSyncing(true);
    setError(null);
    const response = await syncBugs();
    if (response.errorCode) {
      setError(response.message || "Failed to synchronize bugs");
    } else {
      await fetchBugs(); // Refresh the list after synchronization
    }
    setIsSyncing(false);
  };

  // 7. Handlers for local bugs
  const handleReject = async (id: string) => {
    setError(null);
    const response = await rejectLocalBug(id);
    if (response.errorCode) {
      setError(response.message || "Failed to reject bug");
    } else {
      await fetchBugs();
    }
  };

  const handleRestore = async (id: string) => {
    setError(null);
    const response = await restoreLocalBug(id);
    if (response.errorCode) {
      setError(response.message || "Failed to restore bug");
    } else {
      await fetchBugs();
    }
  };

  // Resolves to the error message, or null when the status changed
  const handleChangeStatus = async (
    id: string,
    status: string,
    comment?: string,
  ): Promise<string | null> => {
    const response = await updateBugStatus(id, status, comment);
    if (response.errorCode) {
      return response.message || "Failed to change the status";
    }
    await fetchBugs();
    return null;
  };

  // Resolves to the saved assignees, or to the error message
  const handleSetAssignees = async (
    id: string,
    userIds: string[],
  ): Promise<{ assignees: BugUserRef[] } | { error: string }> => {
    const response = await setBugAssignees(id, userIds);
    if (response.errorCode) {
      return { error: response.message || "Failed to assign the bug" };
    }
    const assignees = response.data ?? [];
    setBugs((current) =>
      current.map((bug) =>
        bug.id === id ? { ...bug, assignedAdmins: assignees } : bug,
      ),
    );
    return { assignees };
  };

  const handleApprove = async (
    id: string,
    status: string,
    comment?: string,
    title?: string,
    description?: string,
    priority?: string,
    category?: string,
    githubRepo?: string,
    component?: string,
  ) => {
    setError(null);
    const response = await updateBugStatus(
      id,
      status,
      comment,
      title,
      description,
      priority,
      category,
      githubRepo,
      component,
    );
    if (response.errorCode) {
      setError(response.message || "Failed to approve bug");
      throw new Error(response.message || "Failed to approve bug");
    } else {
      await fetchBugs();
    }
  };

  return {
    bugs,
    repos,
    categories,
    isLoading,
    error,
    loadError,
    createError,
    clearCreateError: () => setCreateError(null),
    filter,
    // Another filter or tab starts again from the first page
    setFilter: (next: BugFilter) => {
      setFilter(next);
      setPageNumber(1);
    },
    showCreate,
    setShowCreate,
    isSubmitting,
    isSyncing,
    activeTab,
    setActiveTab: (tab: "github" | "local" | "trash") => {
      setActiveTab(tab);
      setPageNumber(1);
    },
    currentPage: pageNumber,
    totalPages,
    onPageChange: setPageNumber,
    handleCreateBug,
    handleSyncBugs,
    handleReject,
    handleRestore,
    handleApprove,
    handleChangeStatus,
    handleSetAssignees,
    refreshBugs: fetchBugs,
    notes,
    isLoadingNotes,
    fetchNotes,
    handleAddNote,
  };
};
