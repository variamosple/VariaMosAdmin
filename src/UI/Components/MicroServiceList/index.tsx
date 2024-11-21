import { MicroService } from "@/Domain/MicroService/MicroService";
import { formatDate } from "@/UI/constants";
import { PaginationControlsProps } from "@/UI/HOC/WithPagination";
import { FC } from "react";
import { Button, ButtonGroup, Table } from "react-bootstrap";
import { ArrowClockwise, PlayFill, StopFill } from "react-bootstrap-icons";
import { Paginator } from "../Paginator";

export interface MicroServiceListParameters extends PaginationControlsProps {
  items: MicroService[];
  onMicroServiceStart: (microservice: MicroService) => void;
  onMicroServiceRestart: (microservice: MicroService) => void;
  onMicroServiceStop: (microservice: MicroService) => void;
}

export const MicroServiceList: FC<MicroServiceListParameters> = ({
  items,
  currentPage,
  totalPages,
  onPageChange,
  onMicroServiceStart,
  onMicroServiceRestart,
  onMicroServiceStop,
}) => {
  return (
    <>
      <Paginator
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>

            <th>Name</th>

            <th>State</th>

            <th>Status</th>

            <th>Created At</th>

            <th className="text-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {items?.map((microService) => (
            <tr key={microService.id}>
              <td className="word-break-all">{microService.id}</td>

              <td className="word-break-all">
                {microService.names.join(", ")}
              </td>

              <td>{microService.state}</td>

              <td>{microService.status}</td>

              <td>
                {microService.created
                  ? formatDate(new Date(microService.created))
                  : null}
              </td>

              <td className="text-center">
                <ButtonGroup size="sm">
                  {microService.state === "exited" && (
                    <Button
                      variant="success"
                      onClick={() => onMicroServiceStart(microService)}
                      title="Start Microservice"
                    >
                      <PlayFill />
                    </Button>
                  )}

                  {microService.state === "running" && (
                    <Button
                      variant="warning"
                      onClick={() => onMicroServiceRestart(microService)}
                      title="Restart Microservice"
                    >
                      <ArrowClockwise />
                    </Button>
                  )}

                  {microService.state === "running" && (
                    <Button
                      variant="danger"
                      onClick={() => onMicroServiceStop(microService)}
                      title="Stop Microservice"
                    >
                      <StopFill />
                    </Button>
                  )}
                </ButtonGroup>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Paginator
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </>
  );
};
