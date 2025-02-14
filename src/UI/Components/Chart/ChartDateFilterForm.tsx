import { useChartContext } from "@/UI/Context/ChartContext";
import { FC } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { SubmitHandler, useForm } from "react-hook-form";

export interface ChartDateFormProperties {
  fromDate: string;
  toDate: string;
}

const formControlsStyle: React.CSSProperties = {
  backgroundImage: "none",
  paddingRight: "0",
};

export interface ChartDateFilterFormProperties {
  onFilterSubmit: (data: ChartDateFormProperties) => void;
}

export const ChartDateFilterForm: FC<ChartDateFilterFormProperties> = ({
  onFilterSubmit,
}) => {
  const { isLoading, chartFilter } = useChartContext();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChartDateFormProperties>({ defaultValues: chartFilter });

  const onSubmit: SubmitHandler<ChartDateFormProperties> = (data) => {
    onFilterSubmit(data);
  };

  return (
    <Form className="w-100 my-1" onSubmit={handleSubmit(onSubmit)}>
      <fieldset className="d-flex gap-3">
        <Form.Group controlId="fromDate">
          <Form.Label className="form-label m-0">From</Form.Label>
          <Form.Control
            type="date"
            className="form-control"
            size="sm"
            {...register("fromDate", { required: "From date is required" })}
            isInvalid={!!errors.fromDate}
            style={formControlsStyle}
          />
          <Form.Control.Feedback type="invalid">
            {errors.fromDate?.message}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group controlId="toDate">
          <Form.Label className="form-label m-0">To</Form.Label>
          <Form.Control
            type="date"
            className="form-control"
            size="sm"
            {...register("toDate", { required: "To date is required" })}
            isInvalid={!!errors.toDate}
            style={formControlsStyle}
          />
          <Form.Control.Feedback type="invalid">
            {errors.toDate?.message}
          </Form.Control.Feedback>
        </Form.Group>
      </fieldset>

      <div className="w-100 text-end mt-2">
        <Button
          className="w-auto"
          variant="primary"
          type="submit"
          size="sm"
          disabled={isLoading}
        >
          {isLoading ? (
            <Spinner animation="border" variant="light" size="sm" />
          ) : (
            "Apply"
          )}
        </Button>
      </div>
    </Form>
  );
};
