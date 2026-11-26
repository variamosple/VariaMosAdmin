import { useUnsavedInput } from "@variamosple/variamos-components";
import { type FC, useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import { queryPermissions } from "@/features/permission-management/api/PermissionRepository";
import type { Permission } from "@/features/permission-management/domain/Entity/Permission";
import { PermissionsFilter } from "@/features/permission-management/domain/Entity/PermissionsFilter";
import type { RolePermission } from "@/features/role-management/domain/Entity/RolePermission";
import { InfiniteSelect } from "@/shared/components/InfiniteSelect";
import type { SelectOptionProps } from "@/shared/components/InfiniteSelect/index.types";
import { useSearchableOptions } from "@/shared/hooks/useSearchableOptions";

const searchPermissions = (search: string, page: number) =>
  queryPermissions(
    new PermissionsFilter({
      name: search,
      pageNumber: page,
    }),
  );

const toOption = ({ id, name }: Permission): SelectOptionProps<number> => ({
  label: name,
  value: Number(id),
});

const NO_OPTION: SelectOptionProps<number> = { label: "", value: 0 };

export interface RolePermissionFormProps {
  /** Says whether the permission was added: the form is then emptied. */
  onRolePermissionSubmit: (rolePermission: RolePermission) => Promise<boolean>;
  isLoading: boolean;
  submitText?: string;
}

export const RolePermissionForm: FC<RolePermissionFormProps> = ({
  onRolePermissionSubmit,
  isLoading,
  submitText = "Add permission",
}) => {
  const [selectedOption, setSelectedOption] =
    useState<SelectOptionProps<number>>(NO_OPTION);
  // A permission chosen and not added yet is input: leaving the page asks first
  useUnsavedInput(selectedOption.value !== NO_OPTION.value);
  const {
    options: permissionOptions,
    isFetching,
    lastOptionRef,
    searchInput,
    onSearchChange,
    onOptionChosen,
  } = useSearchableOptions({ query: searchPermissions, toOption });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RolePermission>();

  const onSubmit: SubmitHandler<RolePermission> = async (data) => {
    if (isLoading) return;
    if (await onRolePermissionSubmit(data)) {
      setSelectedOption(NO_OPTION);
      reset();
    }
  };

  return (
    <Form
      className="d-flex justify-content-between"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Form.Group controlId="name" className="col-6 col-md-4">
        <Controller
          name="permissionId"
          control={control}
          rules={{ required: "Permission is required" }}
          render={({ field: { onChange } }) => (
            <InfiniteSelect
              options={permissionOptions}
              selected={selectedOption}
              placeholder="Select a permission"
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
          {errors.permissionId?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <div>
        <Button variant="primary" type="submit" disabled={isLoading}>
          {isLoading ? (
            <Spinner
              animation="border"
              variant="light"
              size="sm"
              data-testid="loading-spinner"
            />
          ) : (
            submitText
          )}
        </Button>
      </div>
    </Form>
  );
};
