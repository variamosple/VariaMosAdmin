import { useState, useEffect, useCallback } from "react";
import {
  queryBugs,
  createBug,
  queryBugRepos,
  syncBugs,
  queryLocalBugs,
  rejectLocalBug,
  restoreLocalBug,
  updateBugStatus,
  queryCategories,
  queryBugNotes,
  addBugNote,
} from "../api/BugRepository";
import { Bug, BugStatusLog } from "../domain/Bug";
import { BugFilter } from "../domain/BugFilter";

export const useBugList = () => {
  // 1. States for data
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [repos, setRepos] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"github" | "local" | "trash">("github");

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
    queryBugRepos().then((res: any) => {
      if (!res.errorCode) {
        setRepos(res.data || []);
      }
    });
    queryCategories().then((res: any) => {
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
  }, [activeTab]);

  // 3. State for the creation modal
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 4. Function to load bugs (triggered on mount and filter changes)
  const fetchBugs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    let response;
    if (activeTab === "github") {
      response = await queryBugs(filter);
    } else {
      const status = activeTab === "local" ? "pending" : "rejected";
      response = await queryLocalBugs({ ...filter, status });
    }

    if (response.errorCode) {
      setError(response.message || "Failed to load bugs");
    } else {
      setBugs(response.data || []);
    }
    setIsLoading(false);
  }, [filter, activeTab]);

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
      const mapped = (response.data || []).map((n: any) => ({
        id: n.id,
        status: "",
        comment: n.body || "",
        changedAt: n.createdAt,
        changedBy: n.author?.name ? { id: "", name: n.author.name, email: "" } : undefined,
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
    priority: "low" | "medium" | "high",
    category: string,
    githubRepo?: string,
    file?: File,
  ) => {
    setIsSubmitting(true);
    const response = await createBug(title, description, priority, category, githubRepo, file);

    if (response.errorCode) {
      setError(response.message || "Failed to create bug");
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

  const handleApprove = async (
    id: string,
    status: string,
    comment?: string,
    title?: string,
    description?: string,
    priority?: string,
    category?: string,
    githubRepo?: string,
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
    );
    if (response.errorCode) {
      setError(response.message || "Failed to approve bug");
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
    filter,
    setFilter,
    showCreate,
    setShowCreate,
    isSubmitting,
    isSyncing,
    activeTab,
    setActiveTab,
    handleCreateBug,
    handleSyncBugs,
    handleReject,
    handleRestore,
    handleApprove,
    refreshBugs: fetchBugs,
    notes,
    isLoadingNotes,
    fetchNotes,
    handleAddNote,
  };
};
