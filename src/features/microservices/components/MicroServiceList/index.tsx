import { Paginator } from "@variamosple/variamos-components";
import type { FC } from "react";
import { Table } from "react-bootstrap";
import type { PaginationControlsProps } from "@/shared/hoc/WithPagination";
import type { MicroService } from "../../domain/Entity/MicroService";
import { MicroServiceRowComponent } from "./MicroserviceRow";

export interface MicroServiceListParameters extends PaginationControlsProps {
  items: MicroService[];
  onMicroServiceStart: (microservice: MicroService) => void;
  onMicroServiceRestart: (microservice: MicroService) => void;
  onMicroServiceStop: (microservice: MicroService) => void;
  onMicroServiceScale?: (microservice: MicroService, replicas: number) => void;
}

export const MicroServiceList: FC<MicroServiceListParameters> = ({
  items,
  currentPage,
  totalPages,
  onPageChange,
  onMicroServiceStart,
  onMicroServiceRestart,
  onMicroServiceStop,
  onMicroServiceScale,
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
        responsive
        className="w-100 align-middle my-2"
      >
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Latency</th>
            <th>Uptime (30d)</th>
            <th>Port</th>
            <th>Containers</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {items?.map((microService) => (
            <MicroServiceRowComponent
              key={
                microService.id ||
                microService.serviceName ||
                microService.displayName
              }
              microService={microService}
              onMicroServiceStart={onMicroServiceStart}
              onMicroServiceRestart={onMicroServiceRestart}
              onMicroServiceStop={onMicroServiceStop}
              onMicroServiceScale={onMicroServiceScale}
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
