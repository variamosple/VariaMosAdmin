import { ProjectsFilter } from "@/Domain/Project/ProjectFilter";
import { FC, useCallback, useEffect, useRef } from "react";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import { Trash } from "react-bootstrap-icons";
import { SubmitHandler, useForm } from "react-hook-form";

export interface ProjectSearchFormProps {
  onSubmit: (search?: ProjectsFilter) => void;
  isLoading: boolean;
  onSearchReset: () => void;
}

export interface ProjectSearchFormFields {
  name?: string;
  isTemplate?: string;
}

export const ProjectSearchForm: FC<ProjectSearchFormProps> = ({
  onSubmit,
  isLoading,
  onSearchReset,
}) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    watch,
  } = useForm<ProjectSearchFormFields>();

  const values = watch();

  const onReset = () => {
    reset({ name: "", isTemplate: "all" });
    onSearchReset();
  };

  const submit: SubmitHandler<ProjectSearchFormFields> = useCallback(
    (data) => {
      let { isTemplate } = data;

      let template = undefined;

      if (isTemplate === "all") {
        template = undefined;
      } else if (isTemplate === "true") {
        template = true;
      } else if (isTemplate === "false") {
        template = false;
      }

      onSubmit(new ProjectsFilter(data?.name, template));
      reset(data);
    },
    [onSubmit, reset]
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
  }, [values, isDirty, handleSubmit, submit]);

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
              isInvalid={!!errors.name}
            />
          </Form.Group>
        </Col>

        <Col xs={12} sm lg={4} className="mt-2 mt-sm-0">
          <Form.Group className="w-100" controlId="isTemplate">
            <Form.Label>Access level</Form.Label>
            <InputGroup>
              <Form.Select
                className="form-control"
                aria-label="Access level"
                {...register("isTemplate")}
                isInvalid={!!errors.name}
              >
                <option value="all">All</option>
                <option value="true">Public</option>
                <option value="false">Private</option>
              </Form.Select>
              <Button
                title="Clear results"
                variant="outline-secondary"
                onClick={onReset}
                className="fw-bold"
                disabled={isLoading}
              >
                <Trash />
              </Button>
            </InputGroup>
          </Form.Group>
        </Col>
      </Row>
    </Form>
  );
};
