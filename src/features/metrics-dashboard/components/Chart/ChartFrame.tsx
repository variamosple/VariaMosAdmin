import type { FC, ReactNode } from "react";
import { Spinner } from "react-bootstrap";
import { ChartDateFilter } from "./ChartDateFilter";

export interface ChartFrameProps {
  title: string;
  isLoading: boolean;
  hasData: boolean;
  /** The chart, shown once loaded and only when there is data. */
  children: ReactNode;
}

/** A metric's title, its period filter and the space of its chart. */
export const ChartFrame: FC<ChartFrameProps> = ({
  title,
  isLoading,
  hasData,
  children,
}) => (
  <div className="d-flex flex-column align-items-center col-12 col-lg-6 mb-4">
    <div className="d-flex justify-content-between align-items-center my-2 w-100">
      <h2 className="fs-4 my-0 text-center">{title}</h2>

      <ChartDateFilter id={title} />
    </div>

    <div
      className="d-flex justify-content-center align-items-center w-100"
      style={{ height: "350px" }}
    >
      {isLoading ? (
        <Spinner
          data-testid="loading-spinner"
          className="mt-5"
          animation="border"
          variant="primary"
        />
      ) : null}

      {!isLoading && !hasData && (
        <span className="text-muted">No data found.</span>
      )}

      {!isLoading && hasData && children}
    </div>
  </div>
);
