import { ModelsFilter } from "@/Domain/Model/ModelFilter";
import { FC, useCallback, useEffect, useRef } from "react";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import { Trash } from "react-bootstrap-icons";
import { SubmitHandler, useForm } from "react-hook-form";

export interface ModelSearchFormProps {
  onSubmit: (search?: ModelsFilter) => void;
  isLoading: boolean;
  onSearchReset: () => void;
}
export const ModelSearchForm: FC<ModelSearchFormProps> = ({
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
  } = useForm<ModelsFilter>();

  const values = watch();

  const onReset = () => {
    reset({ name: "" });
    onSearchReset();
  };

  const submit: SubmitHandler<ModelsFilter> = useCallback(
    (data) => {
      onSubmit(data);
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
            <InputGroup>
              <Form.Control
                type="text"
                className="form-control"
                placeholder="Search by model name or project name"
                {...register("name")}
                isInvalid={!!errors.name}
              />

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
