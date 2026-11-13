import type { FC } from "react";
import { SortableHeader } from "@/shared/components/SortableHeader";
import type { ListSort } from "@/shared/domain/Entity/ListSort";

type IdNameField = "id" | "name";

export interface IdNameTableHeadProps {
  sort?: ListSort<IdNameField>;
  onSort?: (field: IdNameField) => void;
}

/** The head of a list of named items: ID and Name, sortable, then Actions. */
export const IdNameTableHead: FC<IdNameTableHeadProps> = ({ sort, onSort }) => (
  <thead>
    <tr>
      <SortableHeader field="id" label="ID" sort={sort} onSort={onSort} />

      <SortableHeader field="name" label="Name" sort={sort} onSort={onSort} />

      <th>Actions</th>
    </tr>
  </thead>
);
