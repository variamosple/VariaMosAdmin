import { Language } from "@/Domain/Language/Language";
import { PaginationControlsProps } from "@/UI/HOC/WithPagination";
import { Paginator } from "@variamosple/variamos-components";
import { FC } from "react";
import { Table } from "react-bootstrap";
import { LanguageRowComponent } from "./LanguageRow";

export interface LanguageListProps extends PaginationControlsProps {
  items: Language[];
  onLanguageEdit: (language: Language) => void;
  onLanguageDelete: (language: Language) => void;
}

export const LanguageList: FC<LanguageListProps> = ({
  items,
  currentPage,
  totalPages,
  onPageChange,
  onLanguageEdit,
  onLanguageDelete,
}) => {
  return (
    <>
      <Paginator
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      <Table striped bordered hover responsive>
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
