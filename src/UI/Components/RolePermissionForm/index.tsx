import { queryPermissions } from "@/DataProviders/PermissionRepository";
import { Permission } from "@/Domain/Permission/Entity/Permission";
import { PermissionsFilter } from "@/Domain/Permission/Entity/PermissionsFilter";
import { RolePermission } from "@/Domain/Role/Entity/RolePermission";
import { useDebouncedValue } from "@/UI/Hooks/useDebouncedValue";
import useIntersectionObserver from "@/UI/Hooks/useIntersectionObserver";
import { usePaginatedQuery } from "@/UI/Hooks/usePaginatedQuery";
import { FC, useCallback, useEffect, useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { InfiniteSelect } from "../InfiniteSelect";
import { SelectOptionProps } from "../InfiniteSelect/index.types";

export interface RolePermissionFormProps {
  onRolePermissionSubmit: (rolePermission: RolePermission) => void;
  isLoading: boolean;
  submitText?: string;
}

export const RolePermissionForm: FC<RolePermissionFormProps> = ({
  onRolePermissionSubmit,
  isLoading,
  submitText = "Add permission",
}) => {
  const [selectedOption, setSelectedOption] = useState<
    SelectOptionProps<number>
  >({
    label: "",
    value: 0,
  });
  const [searchInput, setSearchInput] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearchInput = useDebouncedValue<string>(searchValue, 500);
  const [permissionOptions, setSemanticOptions] = useState<
    SelectOptionProps<number>[]
  >([]);

  const onSearchChange = (search: string) => {
    setSearchInput(search);
    setSearchValue(search);
  };

  const handleSelect = (option: SelectOptionProps<number>) => {
    setSelectedOption(option);
    setSearchInput(option.label);
    setSearchValue("");
  };

  const transformToSelectOptions = (
    permissions: Permission[]
  ): SelectOptionProps<number>[] => {
    if (!permissions) return [];

    return permissions?.map(({ id, name }) => {
      return {
        label: name,
        value: id,
      } as SelectOptionProps<number>;
    });
  };

  const {
    loadData: loadPermissionsData,
    isLoading: isFetchingPermissions,
    currentPage: currentPermissionsPage,
    setCurrentPage: setPermissionsCurrentPage,
    totalItems: totalPermissionItems,
  } = usePaginatedQuery<PermissionsFilter, Permission>({
    queryFunction: queryPermissions,
    initialFilter: new PermissionsFilter(),
  });

  const { lastEntryRef, setHasMore, page } = useIntersectionObserver(
    isFetchingPermissions,
    currentPermissionsPage,
    setPermissionsCurrentPage
  );

  const fetchAndSetPermissions = useCallback(async () => {
    loadPermissionsData(new PermissionsFilter(debouncedSearchInput, page)).then(
      (result) => {
        if (page === 1) setSemanticOptions([]);

        setSemanticOptions((prev) => [
          ...prev,
          ...transformToSelectOptions(result?.data || []),
        ]);
      }
    );
  }, [debouncedSearchInput, page, loadPermissionsData]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RolePermission>();

  const onSubmit: SubmitHandler<RolePermission> = (data) => {
    if (!isLoading) {
      onRolePermissionSubmit(data);
    }
  };

  useEffect(() => {
    fetchAndSetPermissions();
  }, [page, fetchAndSetPermissions]);

  useEffect(() => {
    if (totalPermissionItems === 0) return;
    if (!isFetchingPermissions) {
      setHasMore(permissionOptions?.length < totalPermissionItems);
    }
  }, [
    permissionOptions,
    totalPermissionItems,
    isFetchingPermissions,
    setHasMore,
  ]);

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
                handleSelect(option);
              }}
              isFetchingOptions={isFetchingPermissions}
              lastOptionRef={lastEntryRef}
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
            <Spinner animation="border" variant="light" size="sm" />
          ) : (
            submitText
          )}
        </Button>
      </div>
    </Form>
  );
};
