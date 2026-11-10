import { type FC, useCallback, useEffect, useRef } from "react";
import { Col, Form, InputGroup, Row } from "react-bootstrap";
import { Trash } from "react-bootstrap-icons";
import { type SubmitHandler, useForm } from "react-hook-form";
import { ModelsFilter } from "@/features/model-management/domain/Entity/ModelFilter";
import { IconButton } from "@/shared/components/IconButton";

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

export const ModelSearchForm: FC<ModelSearchFormProps> = ({
  onSubmit,
  isLoading,
  onSearchReset,
  defaultFilter,
}) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
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
    reset({
      name: "",
      modelLevel: "all",
      isDeleted: "false",
      isPublic: "all",
    });
    onSearchReset();
  };

  const submit: SubmitHandler<ModelSearchFormFields> = useCallback(
    (data) => {
      const { name, modelLevel, isDeleted, isPublic } = data;

      let levelVal: string | undefined;
      let deleted: boolean | undefined;
      let includeDeleted: boolean | undefined;
      let publicVal: boolean | undefined;

      if (modelLevel === "all") {
        levelVal = undefined;
      } else {
        levelVal = modelLevel;
      }

      if (isDeleted === "all") {
        deleted = undefined;
        includeDeleted = true;
      } else if (isDeleted === "true") {
        deleted = true;
        includeDeleted = true;
      } else if (isDeleted === "false") {
        deleted = false;
        includeDeleted = false;
      }

      if (isPublic === "all") {
        publicVal = undefined;
      } else if (isPublic === "true") {
        publicVal = true;
      } else if (isPublic === "false") {
        publicVal = false;
      }

      onSubmit(
        new ModelsFilter(name, levelVal, deleted, includeDeleted, publicVal),
      );
      reset(data);
    },
    [onSubmit, reset],
  );

  useEffect(() => {
    if (!isDirty) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      handleSubmit(submit)();
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isDirty, handleSubmit, submit]);

  return (
    <Form onSubmit={handleSubmit(submit)}>
      <Row className="d-flex align-items-end mb-3">
        <Col xs={12} sm lg={3}>
          <Form.Group className="w-100" controlId="name">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              className="form-control"
              placeholder="Search by model name or project name"
              {...register("name")}
              isInvalid={!!errors.name}
            />
          </Form.Group>
        </Col>

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
