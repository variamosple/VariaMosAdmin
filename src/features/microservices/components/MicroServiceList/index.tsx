import { Paginator } from "@variamosple/variamos-components";
import type { FC } from "react";
import type { PaginationControlsProps } from "@/shared/hoc/WithPagination";
import type { MicroService } from "../../domain/Entity/MicroService";
import { MicroServiceCard } from "../MicroServiceCard";

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
  onMicroServiceScale = () => {},
}) => {
  return (
    <>
      <div className="my-3">
        {items?.map((microService) => (
          <MicroServiceCard
            key={
              microService.serviceName ||
              microService.id ||
              microService.displayName
            }
            microService={microService}
            onStart={onMicroServiceStart}
            onRestart={onMicroServiceRestart}
            onStop={onMicroServiceStop}
            onScale={onMicroServiceScale}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <Paginator
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
};
