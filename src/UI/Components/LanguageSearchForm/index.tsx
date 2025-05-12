import { LanguagesFilter } from "@/Domain/Language/LanguageFilter";
import { FC, useCallback, useEffect, useRef } from "react";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import { Trash } from "react-bootstrap-icons";
import { SubmitHandler, useForm } from "react-hook-form";

export interface LanguageSearchFormProps {
  onSubmit: (search?: LanguagesFilter) => void;
  isLoading: boolean;
  onSearchReset: () => void;
}
export const LanguageSearchForm: FC<LanguageSearchFormProps> = ({
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
  } = useForm<LanguagesFilter>();

  const values = watch();

  const onReset = () => {
    reset({ name: "", status: "" });
    onSearchReset();
  };

  const submit: SubmitHandler<LanguagesFilter> = useCallback(
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

            <Form.Control
              type="text"
              className="form-control"
              placeholder="Search by language name"
              {...register("name")}
              isInvalid={!!errors.name}
            />
          </Form.Group>
        </Col>

        <Col xs={12} sm lg={4} className="mt-2 mt-sm-0">
          <Form.Group className="w-100" controlId="status">
            <Form.Label>Access level</Form.Label>
            <InputGroup>
              <Form.Select
                className="form-control"
                aria-label="Access level"
                {...register("status")}
                isInvalid={!!errors.name}
              >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="ACTIVE">Active</option>
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
