import { Paginator } from "@variamosple/variamos-components";
import type { FC } from "react";
import { Table } from "react-bootstrap";
import { TableStateRow } from "@/shared/components/TableStateRow";
import type { PaginationControlsProps } from "@/shared/hoc/WithPagination";
import type { ListState } from "@/shared/hooks/usePagedList";
import type { Language } from "../../domain/Entity/Language";
import { LanguageRowComponent } from "./LanguageRow";

export interface LanguageListProps extends PaginationControlsProps {
  items: Language[];
  state?: ListState;
  onLanguageEdit: (language: Language) => void;
  onLanguageDelete: (language: Language) => void;
  onLanguageActivate: (language: Language) => void;
  onLanguageDeactivate: (language: Language) => void;
}

export const LanguageList: FC<LanguageListProps> = ({
  items,
  state,
  currentPage,
  totalPages,
  onPageChange,
  onLanguageEdit,
  onLanguageDelete,
  onLanguageActivate,
  onLanguageDeactivate,
}) => {
  return (
    <>
      <Paginator
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      <Table aria-busy={state?.isLoading} striped bordered hover responsive>
        <thead>
          <tr>
            <th>Name</th>

            <th>Type</th>

            <th>Status</th>

            <th>Owner</th>

            <th>Created At</th>

            <th>Updated At</th>

            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {items?.map((language) => (
            <LanguageRowComponent
              key={language.id}
              language={language}
              onLanguageEdit={onLanguageEdit}
              onLanguageDelete={onLanguageDelete}
              onLanguageActivate={onLanguageActivate}
              onLanguageDeactivate={onLanguageDeactivate}
            />
          ))}
          {state && (
            <TableStateRow
              state={state}
              isEmpty={!items?.length}
              colSpan={7}
              items="languages"
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
