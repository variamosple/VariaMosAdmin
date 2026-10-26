import { type FC, useCallback, useEffect, useRef } from "react";
import { Col, Form, InputGroup, Row } from "react-bootstrap";
import { Trash } from "react-bootstrap-icons";
import { type SubmitHandler, useForm } from "react-hook-form";
import { IconButton } from "@/shared/components/IconButton";
import type { BugUserRef } from "../../domain/Bug";
import {
  BUG_COMPONENT_LABELS,
  BUG_COMPONENTS,
} from "../../domain/BugComponent";
import type { BugFilter } from "../../domain/BugFilter";
import { BUG_PRIORITIES, BUG_PRIORITY_LABELS } from "../../domain/BugPriority";
import { GITHUB_BUG_STATUSES, statusLabel } from "../../domain/BugStatus";

export interface BugSearchFormProps {
  onSubmit: (search?: BugFilter) => void;
  isLoading: boolean;
  onSearchReset: () => void;
  repos: string[];
  activeTab: "github" | "local" | "trash";
  // Offered as the "Assigned to" filter; empty without bugs::update
  assignees?: BugUserRef[];
  // The filters restored from the address (UX-26)
  defaultFilter?: BugFilter;
}
export const BugSearchForm: FC<BugSearchFormProps> = ({
  onSubmit,
  isLoading,
  onSearchReset,
  repos,
  activeTab,
  assignees = [],
  defaultFilter = {},
}) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<BugFilter>({
    defaultValues: {
      repo: defaultFilter.repo ?? "",
      status: defaultFilter.status ?? "",
      priority: defaultFilter.priority ?? "",
      search: defaultFilter.search ?? "",
      assignee: defaultFilter.assignee ?? "",
      component: defaultFilter.component ?? "",
    },
  });

  const _values = watch();

  const onReset = () => {
    reset({
      repo: "",
      status: "",
      priority: "",
      search: "",
      assignee: "",
      component: "",
    });
    onSearchReset();
  };

  const submit: SubmitHandler<BugFilter> = useCallback(
    (data) => {
      onSubmit(data);
      reset(data);
    },
    [onSubmit, reset],
  );

  const clearField = (fieldName: keyof BugFilter) => {
    setValue(fieldName, "");
    // Submit the form immediately to refresh results
    handleSubmit(submit)();
  };

  useEffect(() => {
    if (!isDirty) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      handleSubmit(submit)();
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isDirty, handleSubmit, submit]);

  const isGitHub = activeTab === "github";

  return (
    <Form
      data-testid="bug-search-form"
      onSubmit={handleSubmit(submit)}
      onReset={onReset}
    >
      <Row className="d-flex align-items-end mb-3">
        <Col xs={12} sm={isGitHub ? 6 : 12} lg={isGitHub ? 3 : 6}>
          <Form.Group className="w-100" controlId="name">
            <Form.Label>Name</Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                className="form-control"
                placeholder="Search by name"
                {...register("search")}
                isInvalid={!!errors.search}
              />
              <IconButton
                label="Clear name filter"
                variant="outline-secondary"
                onClick={() => clearField("search")}
                className="fw-bold"
                disabled={isLoading}
                icon={<Trash />}
              />
            </InputGroup>
          </Form.Group>
        </Col>

        {isGitHub && (
          <Col xs={12} sm={6} lg={3}>
            <Form.Group className="w-100" controlId="repo">
              <Form.Label>Repository</Form.Label>
              <InputGroup>
                <Form.Select
                  className="form-select"
                  aria-label="Repository"
                  {...register("repo")}
                  isInvalid={!!errors.repo}
                >
                  <option value="">All</option>
                  {repos.map((repoName: string) => (
                    <option key={repoName} value={repoName}>
                      {repoName}
                    </option>
                  ))}
                </Form.Select>
                <IconButton
                  label="Clear repository filter"
                  variant="outline-secondary"
                  onClick={() => clearField("repo")}
                  className="fw-bold"
                  disabled={isLoading}
                  icon={<Trash />}
                />
              </InputGroup>
            </Form.Group>
          </Col>
        )}

        {isGitHub && (
          <Col xs={12} sm={6} lg={3} className="mt-2 mt-sm-0">
            <Form.Group className="w-100" controlId="status">
              <Form.Label>Status</Form.Label>
              <InputGroup>
                <Form.Select
                  className="form-select"
                  aria-label="Status"
                  {...register("status")}
                  isInvalid={!!errors.status}
                >
                  <option value="">All</option>
                  {GITHUB_BUG_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {statusLabel(status)}
                    </option>
                  ))}
                </Form.Select>

                <IconButton
                  label="Clear status filter"
                  variant="outline-secondary"
                  onClick={() => clearField("status")}
                  className="fw-bold"
                  disabled={isLoading}
                  icon={<Trash />}
                />
              </InputGroup>
            </Form.Group>
          </Col>
        )}

        <Col
          xs={12}
          sm={isGitHub ? 6 : 12}
          lg={isGitHub ? 3 : 6}
          className="mt-2 mt-sm-0"
        >
          <Form.Group className="w-100" controlId="priority">
            <Form.Label>Priority</Form.Label>
            <InputGroup>
              <Form.Select
                className="form-select"
                aria-label="Priority"
                {...register("priority")}
                isInvalid={!!errors.priority}
              >
                <option value="">All</option>
                {BUG_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {BUG_PRIORITY_LABELS[priority]}
                  </option>
                ))}
              </Form.Select>

              <IconButton
                label="Clear priority filter"
                variant="outline-secondary"
                onClick={() => clearField("priority")}
                className="fw-bold"
                disabled={isLoading}
                icon={<Trash />}
              />
            </InputGroup>
          </Form.Group>
        </Col>

        <Col xs={12} sm={6} lg={3} className="mt-2">
          <Form.Group className="w-100" controlId="component">
            <Form.Label>Component</Form.Label>
            <InputGroup>
              <Form.Select
                className="form-select"
                aria-label="Component"
                {...register("component")}
              >
                <option value="">All</option>
                {BUG_COMPONENTS.map((component) => (
                  <option key={component} value={component}>
                    {BUG_COMPONENT_LABELS[component]}
                  </option>
                ))}
              </Form.Select>
              <IconButton
                label="Clear component filter"
                variant="outline-secondary"
                onClick={() => clearField("component")}
                className="fw-bold"
                disabled={isLoading}
                icon={<Trash />}
              />
            </InputGroup>
          </Form.Group>
        </Col>

        {isGitHub && assignees.length > 0 && (
          <Col xs={12} sm={6} lg={3} className="mt-2">
            <Form.Group className="w-100" controlId="assignee">
              <Form.Label>Assigned to</Form.Label>
              <InputGroup>
                <Form.Select
                  className="form-select"
                  aria-label="Assigned to"
                  {...register("assignee")}
                >
                  <option value="">Anyone</option>
                  {assignees.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </Form.Select>
                <IconButton
                  label="Clear assignee filter"
                  variant="outline-secondary"
                  onClick={() => clearField("assignee")}
                  className="fw-bold"
                  disabled={isLoading}
                  icon={<Trash />}
                />
              </InputGroup>
            </Form.Group>
          </Col>
        )}
      </Row>
    </Form>
  );
};
