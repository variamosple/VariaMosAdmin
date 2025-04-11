import { FC, useCallback, useEffect, useRef } from "react";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import { Trash } from "react-bootstrap-icons";
import { SubmitHandler, useForm } from "react-hook-form";

export interface SearchFormProps {
  onSubmit: (search?: string) => void;
  isLoading: boolean;
  onSearchReset: () => void;
  placeholder?: string;
}

export interface SearchFormFields {
  search?: string;
}

export const SearchForm: FC<SearchFormProps> = ({
  onSubmit,
  onSearchReset,
  isLoading,
  placeholder = "Search",
}) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    watch,
  } = useForm<SearchFormFields>();

  const values = watch();

  const onReset = () => {
    onSearchReset();
    reset({ search: "" });
  };

  const submit: SubmitHandler<SearchFormFields> = useCallback(
    (data) => {
      reset(data);
      onSubmit(data.search);
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
      <Row className="mb-3">
        <Col xs={12} sm lg={6}>
          <Form.Group className="w-100" controlId="search">
            <InputGroup>
              <Form.Control
                type="text"
                className="form-control"
                placeholder={placeholder}
                {...register("search")}
                isInvalid={!!errors.search}
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

            <Form.Control.Feedback type="invalid">
              {errors.search?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>
    </Form>
  );
};
