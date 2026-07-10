import { Bug } from "@/Domain/Bug/Bug";
import { deleteAttachment, uploadAttachment } from "@/DataProviders/BugRepository";
import { FC, useEffect, useState } from "react";
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { Trash, Upload } from "react-bootstrap-icons";

interface BugApprovalModalProps {
  show: boolean;
  bug: Bug | null;
  onHide: () => void;
  onConfirmApprove: (
    id: string,
    status: string,
    comment?: string,
    title?: string,
    description?: string,
    priority?: string,
    category?: string,
    githubRepo?: string,
  ) => Promise<void>;
  repos: string[];
  categories: string[];
}

export const BugApprovalModal: FC<BugApprovalModalProps> = ({
  show,
  bug,
  onHide,
  onConfirmApprove,
  repos,
  categories,
}) => {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      category: "Other",
      githubRepo: "",
      comment: "",
    },
  });

  useEffect(() => {
    if (show && bug) {
      reset({
        title: bug.title || "",
        description: bug.description || "",
        priority: bug.priority || "medium",
        category: bug.category || categories[0] || "Other",
        githubRepo: bug.githubRepo || "",
        comment: "",
      });
      setAttachments(bug.attachments || []);
      setModalError(null);
    }
  }, [show, bug, reset, repos, categories]);

  if (!bug) return null;

  const handleFormSubmit = async (data: any) => {
    if (!bug.id) {
      setModalError("Bug ID is missing.");
      return;
    }
    setIsApproving(true);
    setModalError(null);
    try {
      await onConfirmApprove(
        bug.id,
        "open",
        data.comment,
        data.title,
        data.description,
        data.priority,
        data.category,
        data.githubRepo,
      );
      onHide();
    } catch (err: any) {
      setModalError(err.message || "Failed to approve bug");
    } finally {
      setIsApproving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !bug.id) return;
    setIsUploading(true);
    setModalError(null);
    try {
      const response = await uploadAttachment(bug.id, files[0]);
      if (response.errorCode) {
        setModalError(response.message || "Failed to upload attachment");
      } else {
        setAttachments((prev) => [...prev, response.data]);
      }
    } catch (err: any) {
      setModalError(err.message || "Upload error");
    } finally {
      setIsUploading(false);
      e.target.value = ""; // reset file input
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    setModalError(null);
    try {
      const response = await deleteAttachment(attachmentId);
      if (response.errorCode) {
        setModalError(response.message || "Failed to delete attachment");
      } else {
        setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
      }
    } catch (err: any) {
      setModalError(err.message || "Deletion error");
    }
  };

  return (
    <Modal show={show} onHide={onHide} backdrop="static" keyboard={false} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Review and Approve Local Bug</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit(handleFormSubmit)}>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>}

          <Form.Group className="mb-3" controlId="approveTitle">
            <Form.Label>Title *</Form.Label>
            <Form.Control
              type="text"
              isInvalid={!!errors.title}
              {...register("title", { required: "Title is required" })}
            />
            {errors.title && (
              <Form.Control.Feedback type="invalid">{errors.title.message}</Form.Control.Feedback>
            )}
          </Form.Group>

          <Form.Group className="mb-3" controlId="approveDescription">
            <Form.Label>Description *</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
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

          <div className="row mb-3">
            <div className="col-md-6">
              <Form.Group controlId="approveRepo">
                <Form.Label>Target Repository (GitHub) *</Form.Label>
                <Form.Select
                  isInvalid={!!errors.githubRepo}
                  {...register("githubRepo", {
                    required: "GitHub repository is required",
                  })}
                >
                  <option value="">Select repository...</option>
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
            </div>

            <div className="col-md-3">
              <Form.Group controlId="approvePriority">
                <Form.Label>Priority *</Form.Label>
                <Form.Select {...register("priority", { required: true })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Form.Select>
              </Form.Group>
            </div>

            <div className="col-md-3">
              <Form.Group controlId="approveCategory">
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
          </div>

          <hr />

          <div className="mb-3">
            <h6>Manage Attachments</h6>
            {attachments.length === 0 ? (
              <p className="text-muted small">No attachments uploaded.</p>
            ) : (
              <ul className="list-group mb-2">
                {attachments.map((att) => (
                  <li
                    key={att.id}
                    className="list-group-item d-flex justify-content-between align-items-center py-2"
                  >
                    <a
                      href={`${process.env.REACT_APP_ADMIN_API_URL || "http://localhost:4000"}${att.filePath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-none small text-truncate"
                      style={{ maxWidth: "80%" }}
                    >
                      {att.filePath.split("/").pop()} ({att.fileType})
                    </a>
                    <Button
                      variant="link"
                      className="text-danger p-0 ms-2"
                      onClick={() => handleDeleteAttachment(att.id)}
                    >
                      <Trash size={16} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <div className="d-flex align-items-center mt-2">
              <Form.Group controlId="approveFile" className="mb-0">
                <Form.Label className="btn btn-outline-secondary btn-sm mb-0 d-flex align-items-center gap-1">
                  <Upload size={14} /> Add Attachment
                </Form.Label>
                <Form.Control
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  disabled={isUploading}
                />
              </Form.Group>
              {isUploading && (
                <div className="ms-2 d-flex align-items-center text-muted small">
                  <Spinner animation="border" size="sm" className="me-1" />
                  Uploading...
                </div>
              )}
            </div>
          </div>

          <hr />

          <Form.Group className="mb-3" controlId="approveComment">
            <Form.Label>Status Change Comment / Note (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Add details about why this bug is approved or notes for the devs..."
              {...register("comment")}
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={isApproving}>
            Cancel
          </Button>
          <Button variant="success" type="submit" disabled={isApproving || isUploading}>
            {isApproving ? "Approving..." : "Approve & Send to GitHub"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
