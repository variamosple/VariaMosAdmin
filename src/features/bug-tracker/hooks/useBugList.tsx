import type { ResponseModel } from "@variamosple/variamos-components";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { isOneOf } from "@/shared/domain/Value/isOneOf";
import { readPage, useListParams } from "@/shared/hooks/useListQueryState";
import {
  addBugNote,
  type BugStatusChange,
  createBug,
  type NewBug,
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

const BUG_PAGE_SIZE = 20;

export type BugTab = (typeof BUG_TABS)[number];
export const BUG_TABS = ["github", "local", "trash"] as const;
const FILTER_KEYS = [
  "repo",
  "status",
  "priority",
  "search",
  "assignee",
  "component",
] as const;

// The tab, the filters and the page live in the address (UX-26)
const tabOf = (params: URLSearchParams): BugTab => {
  const tab = params.get("tab") ?? "";
  return isOneOf(BUG_TABS, tab) ? tab : "github";
};

const filterOf = (params: URLSearchParams): BugFilter => {
  const filter: BugFilter = {};
  for (const key of FILTER_KEYS) {
    const value = params.get(key);
    if (value) filter[key] = value;
  }
  return filter;
};

const paramsFor = (tab: BugTab, filter: BugFilter, page: number) => {
  const params = new URLSearchParams();
  if (tab !== "github") params.set("tab", tab);
  for (const key of FILTER_KEYS) {
    const value = filter[key];
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  return params;
};

// The repositories and categories the filters and the form offer
const useBugOptions = () => {
  const [repos, setRepos] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    void queryBugRepos().then((res) => {
      if (!res.errorCode) {
        setRepos(res.data || []);
      }
    });
    void queryCategories().then((res) => {
      if (!res.errorCode) {
        setCategories(res.data || []);
      }
    });
  }, []);

  return { repos, categories };
};

// The page of bugs the address names: its tab, filter and page number
const useBugPage = () => {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Load failures are kept apart from action failures: the tab shows an
  // error state instead of the list of another tab or filter (UX-10)
  const [loadError, setLoadError] = useState<string | null>(null);
  const { params, write, restoreKey } = useListParams();
  const activeTab = tabOf(params);
  const pageNumber = readPage(params);
  // The same filter object while its values stay: one load per change
  const filterKey = paramsFor("github", filterOf(params), 1).toString();
  const filter = useMemo(
    () => filterOf(new URLSearchParams(filterKey)),
    [filterKey],
  );
  const [totalCount, setTotalCount] = useState<number>(0);

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
      const data = response.data ?? [];
      // A server without paging sends every bug and no count
      const count = response.totalCount ?? data.length;
      setBugs(data);
      setTotalCount(count);
      // The last bugs of the page were moved away: show the new last page
      const lastPage = Math.max(1, Math.ceil(count / BUG_PAGE_SIZE));
      if (pageNumber > lastPage) {
        write(paramsFor(activeTab, filter, lastPage), "replace");
      }
    }
    setIsLoading(false);
  }, [filter, activeTab, pageNumber, write]);

  useEffect(() => {
    void fetchBugs();
  }, [fetchBugs]);

  return {
    bugs,
    setBugs,
    isLoading,
    loadError,
    filter,
    // Changes with a filter restored from the address: the search form
    // starts again from it
    restoreKey,
    // Another filter or tab starts again from the first page
    setFilter: (next: BugFilter) => {
      write(paramsFor(activeTab, next, 1));
    },
    activeTab,
    // A tab is a place: Back returns to the previous one
    setActiveTab: (tab: BugTab) => {
      write(paramsFor(tab, filter, 1), "push");
    },
    currentPage: pageNumber,
    totalPages: Math.max(1, Math.ceil(totalCount / BUG_PAGE_SIZE)),
    onPageChange: (page: number) => {
      write(paramsFor(activeTab, filter, page));
    },
    fetchBugs,
  };
};

const noteOf = (n: RawBugNote): BugStatusLog => ({
  id: n.id,
  status: "",
  comment: n.body || "",
  changedAt: n.createdAt,
  changedBy: n.author?.name
    ? { id: "", name: n.author.name, email: "" }
    : undefined,
});

type SetError = (error: string | null) => void;

// The comments of the bug shown in the details modal
const useBugNotes = (setError: SetError) => {
  const [notes, setNotes] = useState<BugStatusLog[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState<boolean>(false);

  const fetchNotes = useCallback(
    async (bugId: string) => {
      setIsLoadingNotes(true);
      setError(null);
      const response = await queryBugNotes(bugId);
      if (response.errorCode) {
        setError(response.message || "Failed to load bug notes");
      } else {
        setNotes((response.data ?? []).map(noteOf));
      }
      setIsLoadingNotes(false);
    },
    [setError],
  );

  // Resolves to the error message, shown in the details modal (UX-09)
  const handleAddNote = async (
    bugId: string,
    body: string,
  ): Promise<string | null> => {
    const response = await addBugNote(bugId, body);
    if (response.errorCode) {
      return response.message || "Failed to add the comment";
    }
    await fetchNotes(bugId);
    return null;
  };

  return { notes, isLoadingNotes, fetchNotes, handleAddNote };
};

// The creation of a bug: its failure is shown in the form, which stays
// open (UX-08)
const useBugCreation = (fetchBugs: () => Promise<void>) => {
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateBug = async (bug: NewBug) => {
    setIsSubmitting(true);
    setCreateError(null);
    const response = await createBug(bug);

    if (response.errorCode) {
      setCreateError(response.message || "Failed to create bug");
      setIsSubmitting(false);
      return false; // Indicates creation failure
    }

    setShowCreate(false);
    setIsSubmitting(false);
    void fetchBugs(); // Refresh list
    return true; // Indicates success
  };

  return {
    createError,
    clearCreateError: () => setCreateError(null),
    showCreate,
    setShowCreate,
    isSubmitting,
    handleCreateBug,
  };
};

interface BugActionsDeps {
  fetchBugs: () => Promise<void>;
  setBugs: Dispatch<SetStateAction<Bug[]>>;
  setError: SetError;
}

// A failed action on a local bug shows its reason above the list
const useLocalBugActions = ({ fetchBugs, setError }: BugActionsDeps) => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const reloadUnless = async <T,>(
    request: Promise<ResponseModel<T>>,
    failure: string,
  ) => {
    setError(null);
    const response = await request;
    if (response.errorCode) {
      setError(response.message || failure);
    } else {
      await fetchBugs();
    }
  };

  // Synchronizes with GitHub, then reads the list again
  const handleSyncBugs = async () => {
    setIsSyncing(true);
    await reloadUnless(syncBugs(), "Failed to synchronize bugs");
    setIsSyncing(false);
  };

  const handleApprove = async (id: string, change: BugStatusChange) => {
    setError(null);
    const response = await updateBugStatus(id, change);
    if (response.errorCode) {
      setError(response.message || "Failed to approve bug");
      throw new Error(response.message || "Failed to approve bug");
    }
    await fetchBugs();
  };

  return {
    isSyncing,
    handleSyncBugs,
    handleReject: (id: string) =>
      reloadUnless(rejectLocalBug(id), "Failed to reject bug"),
    handleRestore: (id: string) =>
      reloadUnless(restoreLocalBug(id), "Failed to restore bug"),
    handleApprove,
  };
};

// The changes made from the details modal, which shows their failure
const useBugDetailsActions = ({ fetchBugs, setBugs }: BugActionsDeps) => {
  // Resolves to the error message, or null when the status changed
  const handleChangeStatus = async (
    id: string,
    status: string,
    comment?: string,
  ): Promise<string | null> => {
    const response = await updateBugStatus(id, { status, comment });
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

  return { handleChangeStatus, handleSetAssignees };
};

export const useBugList = () => {
  const options = useBugOptions();
  const { setBugs, fetchBugs, ...page } = useBugPage();
  // The failure of an action or of the comments, shown above the list
  const [error, setError] = useState<string | null>(null);
  const deps = { fetchBugs, setBugs, setError };

  return {
    ...options,
    ...page,
    error,
    ...useBugCreation(fetchBugs),
    ...useLocalBugActions(deps),
    ...useBugDetailsActions(deps),
    refreshBugs: fetchBugs,
    ...useBugNotes(setError),
  };
};
