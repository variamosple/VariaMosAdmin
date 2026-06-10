import { FC, useState } from "react";
import { Button, Form, InputGroup, Modal, Spinner } from "react-bootstrap";
import { Clipboard, ClipboardCheck } from "react-bootstrap-icons";
import { User } from "@/Domain/User/Entity/User";
import { useToast } from "@/UI/Context/ToastContext";
import { generateRecoveryLink } from "@/DataProviders/UserRepository";

interface RecoveryLinkModalProps {
  user: User | undefined;
  show: boolean;
  onHide: () => void;
}

export const RecoveryLinkModal: FC<RecoveryLinkModalProps> = ({
  user,
  show,
  onHide,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [recoveryUrl, setRecoveryUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const { pushToast } = useToast();

  const handleGenerateLink = async () => {
    if (!user) return;
    if (loading) return;

    setLoading(true);
    try {
      const response = await generateRecoveryLink(user.id!);

      if (response.errorCode) {
        pushToast({
          title: "Generation error",
          message: response.message || "Failed to generate recovery link",
          variant: "danger",
        });
      } else {
        setRecoveryUrl(response.data!.recoveryUrl);
      }
    } catch (error: any) {
      pushToast({
        title: "Connection error",
        message: error.message,
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleCopyToClipboard = () => {
    if (recoveryUrl) {
      navigator.clipboard.writeText(recoveryUrl);
      setCopied(true);
      pushToast({
        title: "Link copied",
        message: "Recovery link copied to clipboard",
        variant: "success",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Generate Recovery Link</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p className="text-secondary small">
          Use this to help <strong>{user?.name}</strong> who has lost access to
          their email. Generate a unique link and send it to them via a secure
          channel.
        </p>

        {!recoveryUrl && !loading && (
          <div className="text-center my-3">
            <Button variant="primary" onClick={handleGenerateLink}>
              Generate Secure Link
            </Button>
          </div>
        )}

        {loading && (
          <div className="text-center my-3">
            <Spinner animation="border" variant="primary" size="sm" />
            <p className="text-secondary mt-2 small">Generating link...</p>
          </div>
        )}

        {recoveryUrl && (
          <Form.Group className="mt-3">
            <Form.Label className="form-label align-self-start m-0">
              Copy this link:
            </Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                readOnly
                value={recoveryUrl}
                className="bg-light text-dark border-secondary small font-monospace"
              />
              <Button
                variant={copied ? "success" : "outline-primary"}
                onClick={handleCopyToClipboard}
              >
                {copied ? <ClipboardCheck /> : <Clipboard />}
              </Button>
            </InputGroup>
            {copied && (
              <p className="text-success small mt-1">Copied to clipboard!</p>
            )}
          </Form.Group>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
