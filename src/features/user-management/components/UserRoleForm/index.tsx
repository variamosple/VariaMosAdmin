import { type FC, useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import { queryRoles } from "@/features/role-management/api/RoleRepository";
import type { Role } from "@/features/role-management/domain/Entity/Role";
import { RolesFilter } from "@/features/role-management/domain/Entity/RolesFilter";
import type { UserRole } from "@/features/user-management/domain/Entity/UserRole";
import { InfiniteSelect } from "@/shared/components/InfiniteSelect";
import type { SelectOptionProps } from "@/shared/components/InfiniteSelect/index.types";
import { useSearchableOptions } from "@/shared/hooks/useSearchableOptions";

const searchRoles = (search: string, page: number) =>
  queryRoles(new RolesFilter(search, page));

const toOption = ({ id, name }: Role): SelectOptionProps<number> => ({
  label: name,
  value: Number(id),
});

export interface UserRoleFormProps {
  onUserRoleSubmit: (roleRole: UserRole) => void;
  isLoading: boolean;
  submitText?: string;
}

export const UserRoleForm: FC<UserRoleFormProps> = ({
  onUserRoleSubmit,
  isLoading,
  submitText = "Add role",
}) => {
  const [selectedOption, setSelectedOption] = useState<
    SelectOptionProps<number>
  >({
    label: "",
    value: 0,
  });
  const {
    options: roleOptions,
    isFetching,
    lastOptionRef,
    searchInput,
    onSearchChange,
    onOptionChosen,
  } = useSearchableOptions({ query: searchRoles, toOption });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UserRole>();

  const onSubmit: SubmitHandler<UserRole> = (data) => {
    if (!isLoading) {
      onUserRoleSubmit(data);
    }
  };

  return (
    <Form
      className="d-flex justify-content-between"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Form.Group controlId="name" className="col-6 col-md-4">
        <Controller
          name="roleId"
          control={control}
          rules={{ required: "Role is required" }}
          render={({ field: { onChange } }) => (
            <InfiniteSelect
              options={roleOptions}
              selected={selectedOption}
              placeholder="Select a role"
              handleSelect={(option) => {
                onChange(option.value);
                setSelectedOption(option);
                onOptionChosen(option);
              }}
              isFetchingOptions={isFetching}
              lastOptionRef={lastOptionRef}
              isSearchable={true}
              searchInput={searchInput}
              setSearchInput={onSearchChange}
            />
          )}
        />

        <Form.Control.Feedback type="invalid">
          {errors.roleId?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <div>
        <Button variant="primary" type="submit" disabled={isLoading}>
          {isLoading ? (
            <Spinner animation="border" variant="light" size="sm" />
          ) : (
            submitText
          )}
        </Button>
      </div>
    </Form>
  );
};
