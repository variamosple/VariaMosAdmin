import {
  type FC,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Alert, Badge, Button, Form, Spinner } from "react-bootstrap";
import { queryUsers } from "@/features/user-management/api/UserRepository";
import type { User } from "@/features/user-management/domain/Entity/User";
import { UsersFilter } from "@/features/user-management/domain/Entity/UsersFilter";
import useListenOutsideClicks from "@/shared/hooks/useListenOutsideClicks";

const RECIPIENT_PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;

const label = (user: User) => user.name || user.user || "User";
const detail = (user: User) => user.email || user.user || user.id;

export interface UserRecipientPickerProps {
  selected: User[];
  onAdd: (user: User) => void;
  onRemove: (userId: string) => void;
}

type Search =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; users: User[] };

/**
 * Searches the users on the server, so that every account can be found
 * (UX-03), and follows the WAI-ARIA combobox pattern: arrows move, Enter
 * adds, Escape and an outside click close the list (UX-04).
 */
export const UserRecipientPicker: FC<UserRecipientPickerProps> = ({
  selected,
  onAdd,
  onRemove,
}) => {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState<Search>({ status: "loading" });
  const [active, setActive] = useState(-1);
  // Only the answer to the latest search is shown
  const latest = useRef(0);

  const close = useCallback(() => {
    setOpen(false);
    setActive(-1);
  }, []);
  const { elementRef } = useListenOutsideClicks<HTMLDivElement>(close);

  const fetchUsers = useCallback((term: string) => {
    const request = ++latest.current;
    setSearch({ status: "loading" });
    queryUsers(
      new UsersFilter(
        undefined,
        undefined,
        term.trim() || undefined,
        1,
        RECIPIENT_PAGE_SIZE,
      ),
    ).then((response) => {
      if (request !== latest.current) return;
      if (response.errorCode) {
        setSearch({
          status: "error",
          message: response.message || "The users could not be loaded.",
        });
        return;
      }
      setSearch({ status: "done", users: response.data ?? [] });
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => fetchUsers(query), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [open, query, fetchUsers]);

  const selectedIds = new Set(selected.map((user) => user.id));
  // Disabled and deleted accounts receive nothing: they are not offered
  const options =
    search.status === "done"
      ? search.users.filter(
          (user) =>
            user.isEnabled && !user.isDeleted && !selectedIds.has(user.id),
        )
      : [];

  const add = (user: User) => {
    onAdd(user);
    setQuery("");
    close();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((index) => Math.min(index + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && open && options[active]) {
      // Adds the option instead of submitting the form
      event.preventDefault();
      add(options[active]);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      close();
    }
  };

  const optionId = (index: number) => `${listId}-option-${index}`;

  return (
    <div>
      {selected.length > 0 && (
        <div className="d-flex flex-wrap gap-2 mb-3">
          {selected.map((user) => (
            <Badge
              key={user.id}
              bg="primary"
              className="d-flex align-items-center gap-2 p-2"
              style={{ borderRadius: "20px" }}
            >
              <span>
                {label(user)} ({detail(user)})
              </span>
              <Button
                variant="link"
                className="p-0 text-white border-0 d-flex align-items-center"
                aria-label={`Remove ${label(user)}`}
                onClick={() => onRemove(user.id as string)}
                style={{ lineHeight: 1, boxShadow: "none" }}
              >
                &times;
              </Button>
            </Badge>
          ))}
        </div>
      )}

      <div className="position-relative" ref={elementRef}>
        <Form.Control
          type="text"
          role="combobox"
          aria-label="Search users"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={
            open && options[active] ? optionId(active) : undefined
          }
          placeholder="Search user by name or email..."
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />

        {open && (
          <div
            className="position-absolute w-100 bg-white border rounded shadow-lg mt-1"
            style={{ zIndex: 1000, maxHeight: "220px", overflowY: "auto" }}
          >
            {search.status === "loading" && (
              <div className="p-2 text-muted d-flex align-items-center gap-2">
                <Spinner animation="border" size="sm" /> Searching users...
              </div>
            )}
            {search.status === "error" && (
              <Alert
                variant="danger"
                className="m-2 py-2 d-flex align-items-center gap-2"
              >
                <span>{search.message}</span>
                <Button
                  size="sm"
                  variant="outline-danger"
                  className="ms-auto"
                  onClick={() => fetchUsers(query)}
                >
                  Retry
                </Button>
              </Alert>
            )}
            {search.status === "done" && options.length === 0 && (
              <div className="p-2 text-muted text-center">
                No matching users found
              </div>
            )}
            <div id={listId} role="listbox" aria-label="Users">
              {options.map((user, index) => (
                <div
                  key={user.id}
                  id={optionId(index)}
                  role="option"
                  // Focus stays in the field (aria-activedescendant)
                  tabIndex={-1}
                  aria-selected={index === active}
                  className={`p-2 border-bottom text-dark ${
                    index === active ? "bg-light" : ""
                  }`}
                  style={{ cursor: "pointer" }}
                  // Mouse down keeps the focus in the field
                  onMouseDown={(event) => {
                    event.preventDefault();
                    add(user);
                  }}
                  onMouseEnter={() => setActive(index)}
                >
                  <strong>{label(user)}</strong>{" "}
                  <span className="text-muted">({detail(user)})</span>
                </div>
              ))}
            </div>
            {search.status === "done" &&
              search.users.length === RECIPIENT_PAGE_SIZE && (
                <div className="p-2 small text-muted">
                  First {RECIPIENT_PAGE_SIZE} results: type more of the name or
                  email to narrow them.
                </div>
              )}
          </div>
        )}
        <div className="visually-hidden" aria-live="polite">
          {open && search.status === "done"
            ? `${options.length} user${options.length === 1 ? "" : "s"} found`
            : ""}
        </div>
      </div>
    </div>
  );
};
