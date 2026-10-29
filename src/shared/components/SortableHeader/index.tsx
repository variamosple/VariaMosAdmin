import { Button } from "react-bootstrap";
import { CaretDownFill, CaretUpFill } from "react-bootstrap-icons";
import type { ListSort } from "@/shared/domain/Entity/ListSort";

interface SortableHeaderProps<Field extends string> {
  field: Field;
  label: string;
  sort?: ListSort<Field>;
  onSort?: (field: Field) => void;
}

/** A column header that sorts the list, announced by aria-sort (UX-29) */
export const SortableHeader = <Field extends string>({
  field,
  label,
  sort,
  onSort,
}: SortableHeaderProps<Field>) => {
  if (!onSort) return <th>{label}</th>;
  const order = sort?.by === field ? sort.order : undefined;
  return (
    <th
      aria-sort={
        order === "asc" ? "ascending" : order === "desc" ? "descending" : "none"
      }
    >
      <Button
        variant="link"
        className="p-0 fw-bold text-reset text-decoration-none"
        onClick={() => onSort(field)}
      >
        {label}
        {order === "asc" && <CaretUpFill className="ms-1" aria-hidden />}
        {order === "desc" && <CaretDownFill className="ms-1" aria-hidden />}
      </Button>
    </th>
  );
};
