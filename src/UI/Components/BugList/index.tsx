import { Bug } from "@/Domain/Bug/Bug";
import { FC } from "react";
import { Table } from "react-bootstrap";
import { BugRowComponent } from "./BugRow";

export interface BugListProps {
  items: Bug[];
  onViewDetails: (bug: Bug) => void;
  activeTab?: "github" | "local" | "trash";
  onReject?: (id: string) => void;
  onRestore?: (id: string) => void;
  onApprove?: (bug: Bug) => void;
}

export const BugList: FC<BugListProps> = ({
  items,
  onViewDetails,
  activeTab = "github",
  onReject,
  onRestore,
  onApprove,
}) => {
  const showAttachment = activeTab !== "github";

  return (
    <>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th># ID</th>
            <th>Title</th>
            <th>Description</th>
            <th>Repository</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Creator / Date</th>
            {showAttachment && <th>Attachment</th>}
            <th className="text-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {items && items.length > 0 ? (
            items.map((bug) => (
              <BugRowComponent
                key={bug.id}
                bug={bug}
                onViewDetails={onViewDetails}
                activeTab={activeTab}
                onReject={onReject}
                onRestore={onRestore}
                onApprove={onApprove}
              />
            ))
          ) : (
            <tr>
              <td colSpan={showAttachment ? 9 : 8} className="text-center text-muted py-4">
                No bugs found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </>
  );
};
