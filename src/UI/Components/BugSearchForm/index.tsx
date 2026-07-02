import { BugFilter } from "@/Domain/Bug/BugFilter";
import { FC, useCallback, useEffect, useRef } from "react";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import { Trash } from "react-bootstrap-icons";
import { SubmitHandler, useForm } from "react-hook-form";

export interface BugSearchFormProps {
  onSubmit: (search?: BugFilter) => void;
  isLoading: boolean;
  onSearchReset: () => void;
  repos: string[];
  activeTab: 'github' | 'local' | 'trash';
}
export const BugSearchForm: FC<BugSearchFormProps> = ({
  onSubmit,
  isLoading,
  onSearchReset,
  repos,
  activeTab,
}) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<BugFilter>();

  const values = watch();

  const onReset = () => {
    reset({
      repo: "",
      status: "",
      priority: "",
      search: "",
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

  // Reset form inputs when user switches between tabs
  useEffect(() => {
    reset({
      repo: undefined,
      status: undefined,
      priority: undefined,
      search: undefined,
    });
  }, [activeTab, reset]);

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
  }, [values, isDirty, handleSubmit, submit]);

  const isGitHub = activeTab === "github";

  return (
    <Form onSubmit={handleSubmit(submit)}>
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
              <Button
                title="Clear name filter"
                variant="outline-secondary"
                onClick={() => clearField("search")}
                className="fw-bold"
                disabled={isLoading}
              >
                <Trash />
              </Button>
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
                <Button
                  title="Clear repository filter"
                  variant="outline-secondary"
                  onClick={() => clearField("repo")}
                  className="fw-bold"
                  disabled={isLoading}
                >
                  <Trash />
                </Button>
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
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </Form.Select>

                <Button
                  title="Clear status filter"
                  variant="outline-secondary"
                  onClick={() => clearField("status")}
                  className="fw-bold"
                  disabled={isLoading}
                >
                  <Trash />
                </Button>
              </InputGroup>
            </Form.Group>
          </Col>
        )}

        <Col xs={12} sm={isGitHub ? 6 : 12} lg={isGitHub ? 3 : 6} className="mt-2 mt-sm-0">
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
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Form.Select>

              <Button
                title="Clear priority filter"
                variant="outline-secondary"
                onClick={() => clearField("priority")}
                className="fw-bold"
                disabled={isLoading}
              >
                <Trash />
              </Button>
            </InputGroup>
          </Form.Group>
        </Col>
      </Row>
    </Form>
  );
};
