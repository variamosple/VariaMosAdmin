import { Paginator } from "@variamosple/variamos-components";
import type { FC } from "react";
import { Table } from "react-bootstrap";
import { TableStateRow } from "@/shared/components/TableStateRow";
import type { PaginationControlsProps } from "@/shared/hoc/WithPagination";
import type { ListState } from "@/shared/hooks/usePagedList";
import type { MicroService } from "../../domain/Entity/MicroService";
import { MicroServiceRowComponent } from "./MicroserviceRow";

export interface MicroServiceListParameters extends PaginationControlsProps {
  items: MicroService[];
  state?: ListState;
  onMicroServiceStart: (microservice: MicroService) => void;
  onMicroServiceRestart: (microservice: MicroService) => void;
  onMicroServiceStop: (microservice: MicroService) => void;
  onMicroServiceConfigure?: (microservice: MicroService) => void;
}

export const MicroServiceList: FC<MicroServiceListParameters> = ({
  items,
  state,
  currentPage,
  totalPages,
  onPageChange,
  onMicroServiceStart,
  onMicroServiceRestart,
  onMicroServiceStop,
  onMicroServiceConfigure,
}) => {
  return (
    <>
      <Paginator
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      <Table
        aria-busy={state?.isLoading}
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
              onMicroServiceConfigure={onMicroServiceConfigure}
            />
          ))}
          {state && (
            <TableStateRow
              state={state}
              isEmpty={!items?.length}
              colSpan={7}
              items="microservices"
            />
          )}
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
