import { type FC, useCallback, useMemo } from "react";
import { Col, Form, InputGroup, Row } from "react-bootstrap";
import { Trash } from "react-bootstrap-icons";
import { type SubmitHandler, useForm } from "react-hook-form";
import { IconButton } from "@/shared/components/IconButton";
import { useSearchAsTyped } from "@/shared/hooks/useSearchAsTyped";

export interface SearchFormProps {
  onSubmit: (search?: string) => void;
  isLoading: boolean;
  onSearchReset: () => void;
  placeholder?: string;
  // The search restored from the address (UX-26)
  defaultSearch?: string;
}

interface SearchFormFields {
  search?: string;
}

export const SearchForm: FC<SearchFormProps> = ({
  onSubmit,
  onSearchReset,
  isLoading,
  placeholder = "Search",
  defaultSearch = "",
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    watch,
  } = useForm<SearchFormFields>({
    defaultValues: { search: defaultSearch },
  });

  const _values = watch();

  const onReset = () => {
    onSearchReset();
    reset({ search: "" });
  };

  const submit: SubmitHandler<SearchFormFields> = useCallback(
    (data) => {
      reset(data);
      onSubmit(data.search);
    },
    [onSubmit, reset],
  );

  const search = useMemo(() => handleSubmit(submit), [handleSubmit, submit]);
  useSearchAsTyped(isDirty, search);

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
                isInvalid={Boolean(errors.search)}
              />
              <IconButton
                label="Clear results"
                variant="outline-secondary"
                onClick={onReset}
                className="fw-bold"
                disabled={isLoading}
                icon={<Trash />}
              />
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
