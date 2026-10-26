import { type ChangeEvent, type FC, useEffect, useRef, useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";
import type { Bug } from "../../domain/Bug";
import {
  BUG_COMPONENT_LABELS,
  BUG_COMPONENTS,
} from "../../domain/BugComponent";
import { BUG_PRIORITIES, BUG_PRIORITY_LABELS } from "../../domain/BugPriority";

interface BugFormModalProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (data: Bug, file?: File) => void;
  repos: string[];
  categories: string[];
  isSubmitting: boolean;
  mode?: "user" | "admin";
  // Failure of the last submission: shown in the form, the input is kept
  error?: string | null;
}

export const BugFormModal: FC<BugFormModalProps> = ({
  show,
  onHide,
  onSubmit,
  repos,
  categories,
  isSubmitting,
  mode = "user",
  error,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Bug>({
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      category: "Other",
      component: "",
      githubRepo: "",
    },
  });

  useEffect(() => {
    if (show) {
      reset({
        title: "",
        description: "",
        priority: "medium",
        category: categories[0] || "Other",
        component: "",
        githubRepo: "",
      });
      setSelectedFile(null);
    }
  }, [show, reset, categories]);

  const handleFormSubmit = (data: Bug) => {
    onSubmit(data, selectedFile || undefined);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      backdrop="static"
      keyboard={false}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {mode === "admin" ? "Report a GitHub Bug" : "Report a New Bug"}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit(handleFormSubmit)}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form.Group className="mb-3" controlId="bugTitle">
            <Form.Label>Title *</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. Build error on auth routes"
              isInvalid={!!errors.title}
              {...register("title", {
                required: "Title is required",
                maxLength: {
                  value: 100,
                  message: "Title must not exceed 100 characters",
                },
              })}
            />
            {errors.title && (
              <Form.Control.Feedback type="invalid">
                {errors.title.message as string}
              </Form.Control.Feedback>
            )}
          </Form.Group>

          <Form.Group className="mb-3" controlId="bugDescription">
            <Form.Label>Description *</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Describe step-by-step how to reproduce the bug, the expected behavior, and what actually happens..."
              isInvalid={!!errors.description}
              {...register("description", {
                required: "Description is required",
              })}
            />
            {errors.description && (
              <Form.Control.Feedback type="invalid">
                {errors.description.message as string}
              </Form.Control.Feedback>
            )}
          </Form.Group>

          {mode === "admin" && (
            <Form.Group className="mb-3" controlId="bugRepo">
              <Form.Label>Target Repository (GitHub) *</Form.Label>
              <Form.Select
                isInvalid={!!errors.githubRepo}
                {...register("githubRepo", {
                  required: "Target repository is required",
                })}
              >
                <option value="">Select a repository...</option>
                {repos.map((repo) => (
                  <option key={repo} value={repo}>
                    {repo}
                  </option>
                ))}
              </Form.Select>
              {errors.githubRepo && (
                <Form.Control.Feedback type="invalid">
                  {errors.githubRepo.message as string}
                </Form.Control.Feedback>
              )}
            </Form.Group>
          )}

          <div className="row">
            {mode === "admin" && (
              <div className="col-md-12">
                <Form.Group className="mb-3" controlId="bugPriority">
                  <Form.Label>Priority *</Form.Label>
                  <Form.Select {...register("priority", { required: true })}>
                    {BUG_PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {BUG_PRIORITY_LABELS[priority]}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            )}

            {mode === "user" && (
              <div className="col-md-12">
                <Form.Group className="mb-3" controlId="bugCategory">
                  <Form.Label>Category *</Form.Label>
                  <Form.Select {...register("category", { required: true })}>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            )}

            <div className="col-md-12">
              <Form.Group className="mb-3" controlId="bugComponent">
                <Form.Label>Component</Form.Label>
                <Form.Select {...register("component")}>
                  <option value="">Not specified</option>
                  {BUG_COMPONENTS.map((component) => (
                    <option key={component} value={component}>
                      {BUG_COMPONENT_LABELS[component]}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          </div>

          <Form.Group className="mb-3" controlId="bugFile">
            <Form.Label>Attachment (Optional)</Form.Label>
            <Form.Control
              type="file"
              ref={fileInputRef}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setSelectedFile(e.target.files?.[0] ?? null);
              }}
            />
            {selectedFile && (
              <div className="d-flex align-items-center gap-2 mt-2 small">
                <span className="text-truncate">
                  Selected file: {selectedFile.name}
                </span>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0"
                  onClick={removeSelectedFile}
                  aria-label={`Remove the file ${selectedFile.name}`}
                >
                  Remove
                </Button>
              </div>
            )}
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Creating..."
              : mode === "admin"
                ? "Create public GitHub issue"
                : "Report Bug"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
