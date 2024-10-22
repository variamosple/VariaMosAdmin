import { queryRoles } from "@/DataProviders/RoleRepository";
import { Role } from "@/Domain/Role/Entity/Role";
import { RolesFilter } from "@/Domain/Role/Entity/RolesFilter";
import { UserRole } from "@/Domain/User/Entity/UserRole";
import { useDebouncedValue } from "@/UI/Hooks/useDebouncedValue";
import useIntersectionObserver from "@/UI/Hooks/useIntersectionObserver";
import { usePaginatedQuery } from "@/UI/Hooks/usePaginatedQuery";
import { FC, useCallback, useEffect, useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { InfiniteSelect } from "../InfiniteSelect";
import { SelectOptionProps } from "../InfiniteSelect/index.types";

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
  const [searchInput, setSearchInput] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearchInput = useDebouncedValue<string>(searchValue, 500);
  const [roleOptions, setSemanticOptions] = useState<
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
    roles: Role[]
  ): SelectOptionProps<number>[] => {
    if (!roles) return [];

    return roles?.map(({ id, name }) => {
      return {
        label: name,
        value: id,
      } as SelectOptionProps<number>;
    });
  };

  const {
    loadData: loadRolesData,
    isLoading: isFetchingRoles,
    currentPage: currentRolesPage,
    setCurrentPage: setRolesCurrentPage,
    totalItems: totalRoleItems,
  } = usePaginatedQuery<RolesFilter, Role>({
    queryFunction: queryRoles,
    initialFilter: new RolesFilter(),
  });

  const { lastEntryRef, setHasMore, page } = useIntersectionObserver(
    isFetchingRoles,
    currentRolesPage,
    setRolesCurrentPage
  );

  const fetchAndSetRoles = useCallback(async () => {
    loadRolesData(new RolesFilter(debouncedSearchInput, page)).then(
      (result) => {
        if (page === 1) setSemanticOptions([]);

        setSemanticOptions((prev) => [
          ...prev,
          ...transformToSelectOptions(result?.data || []),
        ]);
      }
    );
  }, [debouncedSearchInput, page, loadRolesData]);

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

  useEffect(() => {
    fetchAndSetRoles();
  }, [page, fetchAndSetRoles]);

  useEffect(() => {
    if (totalRoleItems === 0) return;
    if (!isFetchingRoles) {
      setHasMore(roleOptions?.length < totalRoleItems);
    }
  }, [roleOptions, totalRoleItems, isFetchingRoles, setHasMore]);

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
                handleSelect(option);
              }}
              isFetchingOptions={isFetchingRoles}
              lastOptionRef={lastEntryRef}
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
