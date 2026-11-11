import type { FC } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { type SubmitHandler, useForm } from "react-hook-form";
import {
  type ChartDateFilterFormProperties,
  useChartContext,
} from "../../context/ChartContext";
import {
  type ChartPeriodMode,
  monthPeriod,
  yearPeriod,
} from "../../domain/Entity/ChartPeriod";

const formControlsStyle: React.CSSProperties = {
  backgroundImage: "none",
  paddingRight: "0",
};

interface ChartPeriodFormValues {
  mode: ChartPeriodMode;
  fromDate: string;
  toDate: string;
  month: string;
  year: string;
}

export const ChartDateFilterForm: FC<ChartDateFilterFormProperties> = ({
  onFilterSubmit,
}) => {
  const { isLoading, chartFilter } = useChartContext();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChartPeriodFormValues>({
    defaultValues: {
      mode: "range",
      fromDate: chartFilter.fromDate,
      toDate: chartFilter.toDate,
      month: "",
      year: "",
    },
  });
  const mode = watch("mode");

  const onSubmit: SubmitHandler<ChartPeriodFormValues> = (data) => {
    const period =
      data.mode === "month"
        ? monthPeriod(data.month)
        : data.mode === "year"
          ? yearPeriod(data.year)
          : { fromDate: data.fromDate, toDate: data.toDate };
    if (period) onFilterSubmit(period);
  };

  return (
    <Form className="w-100 my-1" onSubmit={handleSubmit(onSubmit)}>
      <Form.Group controlId="periodMode" className="mb-2">
        <Form.Label className="form-label m-0">Period</Form.Label>
        <Form.Select size="sm" {...register("mode")}>
          <option value="range">Date range</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </Form.Select>
      </Form.Group>

      {mode === "range" && (
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
      )}

      {mode === "month" && (
        <Form.Group controlId="month">
          <Form.Label className="form-label m-0">Month</Form.Label>
          <Form.Control
            type="month"
            className="form-control"
            size="sm"
            {...register("month", {
              required: "Month is required",
              validate: (value) =>
                monthPeriod(value) !== null || "Choose a month",
            })}
            isInvalid={!!errors.month}
            style={formControlsStyle}
          />
          <Form.Control.Feedback type="invalid">
            {errors.month?.message}
          </Form.Control.Feedback>
        </Form.Group>
      )}

      {mode === "year" && (
        <Form.Group controlId="year">
          <Form.Label className="form-label m-0">Year</Form.Label>
          <Form.Control
            type="number"
            className="form-control"
            size="sm"
            min={2000}
            max={2100}
            {...register("year", {
              required: "Year is required",
              validate: (value) =>
                yearPeriod(value) !== null || "Enter a four-digit year",
            })}
            isInvalid={!!errors.year}
            style={formControlsStyle}
          />
          <Form.Control.Feedback type="invalid">
            {errors.year?.message}
          </Form.Control.Feedback>
        </Form.Group>
      )}

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
