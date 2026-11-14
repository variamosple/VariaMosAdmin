import type { FC, ReactNode } from "react";

export interface ChartCardProps {
  title: string;
  /** A line under the title: what is counted, or how. */
  note?: string;
  isEmpty: boolean;
  children: ReactNode;
}

/** A chart of the page: its title, and its drawing or "no data". */
export const ChartCard: FC<ChartCardProps> = ({
  title,
  note,
  isEmpty,
  children,
}) => (
  <section className="border rounded p-3 h-100" aria-label={title}>
    <h3 className="fs-5 mb-0">{title}</h3>
    {note ? <p className="text-muted small mb-0">{note}</p> : null}
    <div className="mt-2">
      {isEmpty ? (
        <p className="text-muted my-4 text-center">
          No activity recorded for the selected period.
        </p>
      ) : (
        children
      )}
    </div>
  </section>
);
