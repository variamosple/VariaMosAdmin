import { Bug } from "@/Domain/Bug/Bug";
import { FC, useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";

interface BugFormModalProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (data: Bug, file?: File) => void;
  repos: string[];
  categories: string[];
  isSubmitting: boolean;
  mode?: "user" | "admin";
}

export const BugFormModal: FC<BugFormModalProps> = ({
  show,
  onHide,
  onSubmit,
  repos,
  categories,
  isSubmitting,
  mode = "user",
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
        githubRepo: "",
      });
      setSelectedFile(null);
    }
  }, [show, reset, repos, categories, mode]);

  const handleFormSubmit = (data: Bug) => {
    onSubmit(data, selectedFile || undefined);
  };

  return (
    <Modal show={show} onHide={onHide} backdrop="static" keyboard={false} centered>
      <Modal.Header closeButton>
        <Modal.Title>{mode === "admin" ? "Report a GitHub Bug" : "Report a New Bug"}</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit(handleFormSubmit)}>
        <Modal.Body>
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
              <Form.Control.Feedback type="invalid">{errors.title.message}</Form.Control.Feedback>
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
                {errors.description.message}
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
                  {errors.githubRepo.message}
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
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
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
          </div>

          <Form.Group className="mb-3" controlId="bugFile">
            <Form.Label>Attachment (Optional)</Form.Label>
            <Form.Control
              type="file"
              onChange={(e: any) => {
                if (e.target.files && e.target.files.length > 0) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Report Bug"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
