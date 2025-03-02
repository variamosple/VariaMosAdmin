import { MicroService } from "@/Domain/MicroService/MicroService";
import { PaginationControlsProps } from "@/UI/HOC/WithPagination";
import { FC } from "react";
import { Table } from "react-bootstrap";
import { Paginator } from "variamos-components";
import { MicroServiceRowComponent } from "./MicroserviceRow";

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

      <Table
        striped
        bordered
        hover
        className="w-100"
        style={{ tableLayout: "fixed" }}
      >
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
            <MicroServiceRowComponent
              key={microService.id}
              microService={microService}
              onMicroServiceStart={onMicroServiceStart}
              onMicroServiceRestart={onMicroServiceRestart}
              onMicroServiceStop={onMicroServiceStop}
            />
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
