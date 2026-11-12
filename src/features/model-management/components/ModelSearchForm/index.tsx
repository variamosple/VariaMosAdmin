import { type FC, useCallback, useMemo } from "react";
import { Col, Form, InputGroup, Row } from "react-bootstrap";
import { Trash } from "react-bootstrap-icons";
import {
  type SubmitHandler,
  type UseFormRegister,
  useForm,
} from "react-hook-form";
import { ModelsFilter } from "@/features/model-management/domain/Entity/ModelFilter";
import { IconButton } from "@/shared/components/IconButton";
import { useSearchAsTyped } from "@/shared/hooks/useSearchAsTyped";

export interface ModelSearchFormProps {
  onSubmit: (search?: ModelsFilter) => void;
  isLoading: boolean;
  onSearchReset: () => void;
  // The search restored from the address (UX-26)
  defaultFilter?: ModelsFilter;
}
// A yes, no or any choice of the form, from a filter value
const choiceOf = (value?: boolean) =>
  value === undefined ? "all" : String(value);

// The "deleted" choice: only deleted, deleted or not, or not deleted
const deletedChoiceOf = (isDeleted?: boolean, includeDeleted?: boolean) => {
  if (isDeleted === true) return "true";
  return includeDeleted ? "all" : "false";
};

interface ModelSearchFormFields {
  name?: string;
  modelLevel?: string;
  isDeleted?: string;
  isPublic?: string;
}

const EMPTY_SEARCH: ModelSearchFormFields = {
  name: "",
  modelLevel: "all",
  isDeleted: "false",
  isPublic: "all",
};

// "all" leaves the field out of the filter
const BOOLEAN_CHOICES = new Map([
  ["true", true],
  ["false", false],
]);
const DELETED_CHOICES = new Map([
  ["all", { isDeleted: undefined, includeDeleted: true }],
  ["true", { isDeleted: true, includeDeleted: true }],
  ["false", { isDeleted: false, includeDeleted: false }],
]);

const filterOf = (data: ModelSearchFormFields) =>
  new ModelsFilter({
    name: data.name,
    modelLevel: data.modelLevel === "all" ? undefined : data.modelLevel,
    ...DELETED_CHOICES.get(data.isDeleted ?? ""),
    isPublic: BOOLEAN_CHOICES.get(data.isPublic ?? ""),
  });

const ChoiceFields: FC<{
  register: UseFormRegister<ModelSearchFormFields>;
}> = ({ register }) => (
  <>
    <Col xs={12} sm lg={3} className="mt-2 mt-sm-0">
      <Form.Group className="w-100" controlId="modelLevel">
        <Form.Label>Level</Form.Label>
        <Form.Select
          className="form-control"
          aria-label="Level"
          {...register("modelLevel")}
        >
          <option value="all">All</option>
          <option value="domain">Domain Model</option>
          <option value="application">Application Model</option>
        </Form.Select>
      </Form.Group>
    </Col>

    <Col xs={12} sm lg={3} className="mt-2 mt-sm-0">
      <Form.Group className="w-100" controlId="isPublic">
        <Form.Label>Access level</Form.Label>
        <Form.Select
          className="form-control"
          aria-label="Access level"
          {...register("isPublic")}
        >
          <option value="all">All</option>
          <option value="true">Public</option>
          <option value="false">Private</option>
        </Form.Select>
      </Form.Group>
    </Col>
  </>
);

export const ModelSearchForm: FC<ModelSearchFormProps> = ({
  onSubmit,
  isLoading,
  onSearchReset,
  defaultFilter,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    watch,
  } = useForm<ModelSearchFormFields>({
    defaultValues: {
      name: defaultFilter?.name ?? "",
      modelLevel: defaultFilter?.modelLevel ?? "all",
      isDeleted: deletedChoiceOf(
        defaultFilter?.isDeleted,
        defaultFilter?.includeDeleted,
      ),
      isPublic: choiceOf(defaultFilter?.isPublic),
    },
  });

  const _values = watch();

  const onReset = () => {
    reset(EMPTY_SEARCH);
    onSearchReset();
  };

  const submit: SubmitHandler<ModelSearchFormFields> = useCallback(
    (data) => {
      onSubmit(filterOf(data));
      reset(data);
    },
    [onSubmit, reset],
  );
  const search = useMemo(() => handleSubmit(submit), [handleSubmit, submit]);
  useSearchAsTyped(isDirty, search);

  return (
    <Form onSubmit={search}>
      <Row className="d-flex align-items-end mb-3">
        <Col xs={12} sm lg={3}>
          <Form.Group className="w-100" controlId="name">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              className="form-control"
              placeholder="Search by model name or project name"
              {...register("name")}
              isInvalid={Boolean(errors.name)}
            />
          </Form.Group>
        </Col>

        <ChoiceFields register={register} />

        <Col xs={12} sm lg={3} className="mt-2 mt-sm-0">
          <Form.Group className="w-100" controlId="isDeleted">
            <Form.Label>Status</Form.Label>
            <InputGroup>
              <Form.Select
                className="form-control"
                aria-label="Status"
                {...register("isDeleted")}
              >
                <option value="false">Active</option>
                <option value="true">Deleted</option>
                <option value="all">All</option>
              </Form.Select>
              <IconButton
                label="Clear results"
                variant="outline-secondary"
                onClick={onReset}
                className="fw-bold"
                disabled={isLoading}
                icon={<Trash />}
              />
            </InputGroup>
          </Form.Group>
        </Col>
      </Row>
    </Form>
  );
};
