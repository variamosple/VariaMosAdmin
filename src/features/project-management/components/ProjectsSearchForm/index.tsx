import { type FC, useCallback, useMemo } from "react";
import { Col, Form, Row } from "react-bootstrap";
import { type SubmitHandler, useForm } from "react-hook-form";
import { ProjectsFilter } from "@/features/project-management/domain/Entity/ProjectFilter";
import { DeletedStatusField } from "@/shared/components/DeletedStatusField";
import { useSearchAsTyped } from "@/shared/hooks/useSearchAsTyped";

export interface ProjectSearchFormProps {
  onSubmit: (search?: ProjectsFilter) => void;
  isLoading: boolean;
  onSearchReset: () => void;
  // The search restored from the address (UX-26)
  defaultFilter?: ProjectsFilter;
}
// A yes, no or any choice of the form, from a filter value
const choiceOf = (value?: boolean) =>
  value === undefined ? "all" : String(value);

// The "deleted" choice: only deleted, deleted or not, or not deleted
const deletedChoiceOf = (isDeleted?: boolean, includeDeleted?: boolean) => {
  if (isDeleted === true) return "true";
  return includeDeleted ? "all" : "false";
};

interface ProjectSearchFormFields {
  name?: string;
  isTemplate?: string;
  isDeleted?: string;
}

export const ProjectSearchForm: FC<ProjectSearchFormProps> = ({
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
  } = useForm<ProjectSearchFormFields>({
    defaultValues: {
      name: defaultFilter?.name ?? "",
      isTemplate: choiceOf(defaultFilter?.isTemplate),
      isDeleted: deletedChoiceOf(
        defaultFilter?.isDeleted,
        defaultFilter?.includeDeleted,
      ),
    },
  });

  const _values = watch();

  const onReset = () => {
    reset({ name: "", isTemplate: "all", isDeleted: "false" });
    onSearchReset();
  };

  const submit: SubmitHandler<ProjectSearchFormFields> = useCallback(
    (data) => {
      const { isTemplate, isDeleted } = data;

      let template: boolean | undefined;
      let deleted: boolean | undefined;
      let includeDeleted: boolean | undefined;

      if (isTemplate === "all") {
        template = undefined;
      } else if (isTemplate === "true") {
        template = true;
      } else if (isTemplate === "false") {
        template = false;
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

      onSubmit(
        new ProjectsFilter({
          name: data?.name,
          isTemplate: template,
          isDeleted: deleted,
          includeDeleted,
        }),
      );
      reset(data);
    },
    [onSubmit, reset],
  );

  const search = useMemo(() => handleSubmit(submit), [handleSubmit, submit]);
  useSearchAsTyped(isDirty, search);

  return (
    <Form onSubmit={handleSubmit(submit)}>
      <Row className="d-flex align-items-end mb-3">
        <Col xs={12} sm lg={4}>
          <Form.Group className="w-100" controlId="name">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              className="form-control"
              placeholder="Project name"
              {...register("name")}
              isInvalid={Boolean(errors.name)}
            />
          </Form.Group>
        </Col>

        <Col xs={12} sm lg={4} className="mt-2 mt-sm-0">
          <Form.Group className="w-100" controlId="isTemplate">
            <Form.Label>Access level</Form.Label>
            <Form.Select
              className="form-control"
              aria-label="Access level"
              {...register("isTemplate")}
            >
              <option value="all">All</option>
              <option value="true">Public</option>
              <option value="false">Private</option>
            </Form.Select>
          </Form.Group>
        </Col>

        <Col xs={12} sm lg={4} className="mt-2 mt-sm-0">
          <DeletedStatusField
            registration={register("isDeleted")}
            onReset={onReset}
            isLoading={isLoading}
          />
        </Col>
      </Row>
    </Form>
  );
};
