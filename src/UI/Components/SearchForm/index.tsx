import { FC } from "react";
import { Button, ButtonGroup, Col, Form, Row } from "react-bootstrap";
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
  const {
    register,
    handleSubmit,

    reset,
    formState: { errors },
  } = useForm<SearchFormFields>();

  const onReset = () => {
    reset();
    onSearchReset();
  };

  const submit: SubmitHandler<SearchFormFields> = (data) => {
    onSubmit(data.search);
  };

  return (
    <Form onSubmit={handleSubmit(submit)}>
      <Row className="mb-3">
        <Col xs={12} sm lg={9}>
          <Form.Group className="w-100" controlId="search">
            <Form.Control
              type="text"
              className="form-control"
              placeholder={placeholder}
              {...register("search")}
              isInvalid={!!errors.search}
            />
            <Form.Control.Feedback type="invalid">
              {errors.search?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col xs={12} sm="auto" lg={3} className="mt-2 mt-sm-0 text-center">
          <ButtonGroup className="d-flex w-100">
            <Button
              type="button"
              onClick={() => reset()}
              disabled={isLoading}
              className="flex-fill"
            >
              Clear
            </Button>
            <Button
              type="button"
              onClick={onReset}
              disabled={isLoading}
              className="flex-fill"
            >
              Reset
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-fill">
              Search
            </Button>
          </ButtonGroup>
        </Col>
      </Row>
    </Form>
  );
};
