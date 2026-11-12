import {
  type ChangeEvent,
  type FC,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap";
import { Trash, Upload } from "react-bootstrap-icons";
import {
  type FieldErrors,
  type UseFormRegister,
  useForm,
} from "react-hook-form";
import { attachmentUrl } from "../../api/attachmentUrl";
import {
  type BugStatusChange,
  deleteAttachment,
  uploadAttachment,
} from "../../api/BugRepository";
import type { Bug, BugAttachment } from "../../domain/Bug";
import {
  BUG_COMPONENT_LABELS,
  BUG_COMPONENTS,
} from "../../domain/BugComponent";
import {
  BUG_PRIORITIES,
  BUG_PRIORITY_LABELS,
  type BugPriority,
} from "../../domain/BugPriority";

interface ApproveFormData {
  title: string;
  description: string;
  priority: BugPriority;
  category: string;
  component: string;
  githubRepo: string;
  comment: string;
}

interface BugApprovalModalProps {
  show: boolean;
  bug: Bug | null;
  onHide: () => void;
  onConfirmApprove: (id: string, change: BugStatusChange) => Promise<void>;
  repos: string[];
  categories: string[];
}

type SetError = (error: string | null) => void;

// The attachments of the bug, added or deleted before the approval
const useAttachments = (bug: Bug | null, setModalError: SetError) => {
  const [attachments, setAttachments] = useState<BugAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<number | null>(
    null,
  );

  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !bug?.id) return;
    setIsUploading(true);
    setModalError(null);
    try {
      const response = await uploadAttachment(bug.id, file);
      if (response.errorCode) {
        setModalError(response.message || "Failed to upload attachment");
      } else if (response.data !== undefined) {
        const data = response.data;
        setAttachments((prev) => [...prev, data]);
      }
    } catch (err) {
      setModalError(
        err instanceof Error && err.message !== ""
          ? err.message
          : "Upload error",
      );
    } finally {
      setIsUploading(false);
      e.target.value = ""; // reset file input
    }
  };

  const remove = async (attachmentId: number) => {
    setAttachmentToDelete(null);
    setModalError(null);
    try {
      const response = await deleteAttachment(attachmentId.toString());
      if (response.errorCode) {
        setModalError(response.message || "Failed to delete attachment");
      } else {
        setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
      }
    } catch (err) {
      setModalError(
        err instanceof Error && err.message !== ""
          ? err.message
          : "Deletion error",
      );
    }
  };

  return {
    attachments,
    setAttachments,
    isUploading,
    attachmentToDelete,
    setAttachmentToDelete,
    upload,
    remove,
  };
};

type Attachments = ReturnType<typeof useAttachments>;

interface FieldsProps {
  register: UseFormRegister<ApproveFormData>;
  errors: FieldErrors<ApproveFormData>;
}

const TextFields: FC<FieldsProps> = ({ register, errors }) => (
  <>
    <Form.Group className="mb-3" controlId="approveTitle">
      <Form.Label>Title *</Form.Label>
      <Form.Control
        type="text"
        isInvalid={Boolean(errors.title)}
        {...register("title", { required: "Title is required" })}
      />
      {errors.title ? (
        <Form.Control.Feedback type="invalid">
          {errors.title.message}
        </Form.Control.Feedback>
      ) : null}
    </Form.Group>

    <Form.Group className="mb-3" controlId="approveDescription">
      <Form.Label>Description *</Form.Label>
      <Form.Control
        as="textarea"
        rows={4}
        isInvalid={Boolean(errors.description)}
        {...register("description", {
          required: "Description is required",
        })}
      />
      {errors.description ? (
        <Form.Control.Feedback type="invalid">
          {errors.description.message}
        </Form.Control.Feedback>
      ) : null}
    </Form.Group>
  </>
);

const ClassificationFields: FC<
  FieldsProps & { repos: string[]; categories: string[] }
> = ({ register, errors, repos, categories }) => (
  <>
    <div className="row mb-3">
      <div className="col-md-6">
        <Form.Group controlId="approveRepo">
          <Form.Label>Target Repository (GitHub) *</Form.Label>
          <Form.Select
            isInvalid={Boolean(errors.githubRepo)}
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
          {errors.githubRepo ? (
            <Form.Control.Feedback type="invalid">
              {errors.githubRepo.message}
            </Form.Control.Feedback>
          ) : null}
        </Form.Group>
      </div>

      <div className="col-md-3">
        <Form.Group controlId="approvePriority">
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

    <div className="row mb-3">
      <div className="col-md-6">
        <Form.Group controlId="approveComponent">
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
  </>
);

const AttachmentItem: FC<{ att: BugAttachment; files: Attachments }> = ({
  att,
  files,
}) => {
  const fileName = att.filePath.split("/").pop();
  return (
    <li className="list-group-item d-flex justify-content-between align-items-center py-2">
      <a
        href={attachmentUrl(att.filePath)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-decoration-none small text-truncate"
        style={{ maxWidth: "60%" }}
      >
        {fileName} ({att.fileType})
      </a>
      {files.attachmentToDelete === att.id ? (
        <div className="d-flex align-items-center gap-2 small">
          <span>Delete this attachment?</span>
          <Button
            variant="danger"
            size="sm"
            onClick={() => files.remove(att.id)}
          >
            Delete attachment
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => files.setAttachmentToDelete(null)}
          >
            Keep
          </Button>
        </div>
      ) : (
        <Button
          variant="link"
          className="text-danger p-0 ms-2"
          onClick={() => files.setAttachmentToDelete(att.id)}
          aria-label={`Delete attachment ${fileName}`}
          title={`Delete attachment ${fileName}`}
        >
          <Trash size={16} aria-hidden="true" />
        </Button>
      )}
    </li>
  );
};

const AttachmentManager: FC<{ files: Attachments }> = ({ files }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { attachments, isUploading } = files;
  return (
    <div className="mb-3">
      <h6>Manage Attachments</h6>
      {attachments.length === 0 ? (
        <p className="text-muted small">No attachments uploaded.</p>
      ) : (
        <ul className="list-group mb-2">
          {attachments.map((att) => (
            <AttachmentItem key={att.id} att={att} files={files} />
          ))}
        </ul>
      )}

      <div className="d-flex align-items-center mt-2">
        {/* A real button opens the file picker: the hidden input alone
          cannot be reached with the keyboard (UX-12) */}
        <Button
          variant="outline-secondary"
          size="sm"
          className="d-flex align-items-center gap-1"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload size={14} aria-hidden="true" /> Add attachment
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={files.upload}
          aria-label="Add attachment"
          hidden
          disabled={isUploading}
        />
        {isUploading ? (
          <div className="ms-2 d-flex align-items-center text-muted small">
            <Spinner animation="border" size="sm" className="me-1" />
            Uploading...
          </div>
        ) : null}
      </div>
    </div>
  );
};

interface ApprovalFooterProps {
  pendingApproval: ApproveFormData | null;
  setPendingApproval: (data: ApproveFormData | null) => void;
  isApproving: boolean;
  isUploading: boolean;
  onPublish: () => void;
  onHide: () => void;
}

const ApprovalFooter: FC<ApprovalFooterProps> = (props) => {
  const { pendingApproval, isApproving, isUploading } = props;
  if (!pendingApproval) {
    return (
      <Modal.Footer>
        <Button variant="secondary" onClick={props.onHide}>
          Cancel
        </Button>
        <Button variant="success" type="submit" disabled={isUploading}>
          Approve & Send to GitHub
        </Button>
      </Modal.Footer>
    );
  }
  return (
    <Modal.Footer className="flex-column align-items-stretch">
      <Alert variant="warning" className="mb-2">
        Approving publishes a <strong>public</strong> issue in{" "}
        <strong>{pendingApproval.githubRepo}</strong>, visible to anyone. It
        includes the title, the description, the comment, the reporter&apos;s
        e-mail and yours.
      </Alert>
      <div className="d-flex justify-content-end gap-2">
        <Button
          variant="secondary"
          onClick={() => props.setPendingApproval(null)}
          disabled={isApproving}
        >
          Back to editing
        </Button>
        <Button
          variant="success"
          onClick={props.onPublish}
          disabled={isApproving || isUploading}
        >
          {isApproving ? "Publishing..." : "Publish to GitHub"}
        </Button>
      </div>
    </Modal.Footer>
  );
};

const changeOf = (data: ApproveFormData): BugStatusChange => ({
  status: "open",
  comment: data.comment,
  title: data.title,
  description: data.description,
  priority: data.priority,
  category: data.category,
  githubRepo: data.githubRepo,
  component: data.component,
});

const formValuesOf = (bug: Bug, categories: string[]): ApproveFormData => ({
  title: bug.title || "",
  description: bug.description || "",
  priority: bug.priority || "medium",
  category: bug.category || categories[0] || "Other",
  component: bug.component || "",
  githubRepo: bug.githubRepo || "",
  comment: "",
});

export const BugApprovalModal: FC<BugApprovalModalProps> = ({
  show,
  bug,
  onHide,
  onConfirmApprove,
  repos,
  categories,
}) => {
  const titleId = useId();
  const [isApproving, setIsApproving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  // Approval publishes a public GitHub issue: the form is checked first,
  // then the administrator confirms with the consequences in view (UX-13)
  const [pendingApproval, setPendingApproval] =
    useState<ApproveFormData | null>(null);
  const files = useAttachments(bug, setModalError);
  const { setAttachments, setAttachmentToDelete } = files;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApproveFormData>({
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      category: "Other",
      component: "",
      githubRepo: "",
      comment: "",
    },
  });

  useEffect(() => {
    if (show && bug) {
      reset(formValuesOf(bug, categories));
      setAttachments(bug.attachments || []);
      setModalError(null);
      setPendingApproval(null);
      setAttachmentToDelete(null);
    }
  }, [show, bug, reset, categories, setAttachments, setAttachmentToDelete]);

  if (!bug) return null;

  const publishApproval = async () => {
    const data = pendingApproval;
    if (!data) return;
    if (!bug.id) {
      setModalError("Bug ID is missing.");
      return;
    }
    setIsApproving(true);
    setModalError(null);
    try {
      await onConfirmApprove(bug.id, changeOf(data));
      onHide();
    } catch (err) {
      setModalError(
        err instanceof Error && err.message !== ""
          ? err.message
          : "Failed to approve bug",
      );
      setPendingApproval(null);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <Modal
      aria-labelledby={titleId}
      show={show}
      onHide={onHide}
      backdrop="static"
      keyboard={false}
      size="lg"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id={titleId}>Review and Approve Local Bug</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit(setPendingApproval)}>
        <Modal.Body>
          {modalError ? <Alert variant="danger">{modalError}</Alert> : null}

          {/* Frozen while the approval waits for confirmation: what is
              published is what was reviewed */}
          <fieldset disabled={Boolean(pendingApproval)}>
            <TextFields register={register} errors={errors} />
            <ClassificationFields
              register={register}
              errors={errors}
              repos={repos}
              categories={categories}
            />

            <hr />
            <AttachmentManager files={files} />
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
          </fieldset>
        </Modal.Body>

        <ApprovalFooter
          pendingApproval={pendingApproval}
          setPendingApproval={setPendingApproval}
          isApproving={isApproving}
          isUploading={files.isUploading}
          onPublish={publishApproval}
          onHide={onHide}
        />
      </Form>
    </Modal>
  );
};
