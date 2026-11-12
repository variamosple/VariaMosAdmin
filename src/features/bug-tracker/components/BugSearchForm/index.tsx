import { type FC, useCallback, useMemo } from "react";
import { Col, type ColProps, Form, InputGroup, Row } from "react-bootstrap";
import { Trash } from "react-bootstrap-icons";
import {
  type FieldErrors,
  type SubmitHandler,
  type UseFormRegister,
  useForm,
} from "react-hook-form";
import { IconButton } from "@/shared/components/IconButton";
import { useSearchAsTyped } from "@/shared/hooks/useSearchAsTyped";
import type { BugUserRef } from "../../domain/Bug";
import {
  BUG_COMPONENT_LABELS,
  BUG_COMPONENTS,
} from "../../domain/BugComponent";
import type { BugFilter } from "../../domain/BugFilter";
import { BUG_PRIORITIES, BUG_PRIORITY_LABELS } from "../../domain/BugPriority";
import { GITHUB_BUG_STATUSES, statusLabel } from "../../domain/BugStatus";

export interface BugSearchFormProps {
  onSubmit: (search?: BugFilter) => void;
  isLoading: boolean;
  onSearchReset: () => void;
  repos: string[];
  activeTab: "github" | "local" | "trash";
  // Offered as the "Assigned to" filter; empty without bugs::update
  assignees?: BugUserRef[];
  // The filters restored from the address (UX-26)
  defaultFilter?: BugFilter;
}
const NO_ASSIGNEES: NonNullable<BugSearchFormProps["assignees"]> = [];
const NO_FILTER: NonNullable<BugSearchFormProps["defaultFilter"]> = {};

const EMPTY_FILTER: BugFilter = {
  repo: "",
  status: "",
  priority: "",
  search: "",
  assignee: "",
  component: "",
};

const formValuesOf = (filter: BugFilter): BugFilter => ({
  repo: filter.repo ?? "",
  status: filter.status ?? "",
  priority: filter.priority ?? "",
  search: filter.search ?? "",
  assignee: filter.assignee ?? "",
  component: filter.component ?? "",
});

/** What every field of the form uses. */
interface FilterForm {
  register: UseFormRegister<BugFilter>;
  errors: FieldErrors<BugFilter>;
  // Empties the field and searches again at once
  clearField: (fieldName: keyof BugFilter) => void;
  isLoading: boolean;
}

interface FilterSelectProps {
  form: FilterForm;
  field: "repo" | "status" | "priority" | "component" | "assignee";
  label: string;
  // What the clear button names: "Clear <noun> filter"
  noun: string;
  options: { value: string; label: string }[];
  anyLabel?: string;
  layout: Pick<ColProps, "sm" | "lg" | "className">;
}

const FilterSelect: FC<FilterSelectProps> = (props) => {
  const { form, field, label, layout } = props;
  return (
    <Col xs={12} {...layout}>
      <Form.Group className="w-100" controlId={field}>
        <Form.Label>{label}</Form.Label>
        <InputGroup>
          <Form.Select
            className="form-select"
            aria-label={label}
            {...form.register(field)}
            isInvalid={Boolean(form.errors[field])}
          >
            <option value="">{props.anyLabel ?? "All"}</option>
            {props.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
          <IconButton
            label={`Clear ${props.noun} filter`}
            variant="outline-secondary"
            onClick={() => form.clearField(field)}
            className="fw-bold"
            disabled={form.isLoading}
            icon={<Trash />}
          />
        </InputGroup>
      </Form.Group>
    </Col>
  );
};

const NameFilter: FC<{ form: FilterForm; isGitHub: boolean }> = ({
  form,
  isGitHub,
}) => (
  <Col xs={12} sm={isGitHub ? 6 : 12} lg={isGitHub ? 3 : 6}>
    <Form.Group className="w-100" controlId="name">
      <Form.Label>Name</Form.Label>
      <InputGroup>
        <Form.Control
          type="text"
          className="form-control"
          placeholder="Search by name"
          {...form.register("search")}
          isInvalid={Boolean(form.errors.search)}
        />
        <IconButton
          label="Clear name filter"
          variant="outline-secondary"
          onClick={() => form.clearField("search")}
          className="fw-bold"
          disabled={form.isLoading}
          icon={<Trash />}
        />
      </InputGroup>
    </Form.Group>
  </Col>
);

const REPO_LAYOUT = { sm: 6, lg: 3 };
const SECOND_ROW_LAYOUT = { sm: 6, lg: 3, className: "mt-2" };
const STATUS_OPTIONS = GITHUB_BUG_STATUSES.map((status) => ({
  value: status,
  label: statusLabel(status),
}));
const PRIORITY_OPTIONS = BUG_PRIORITIES.map((priority) => ({
  value: priority,
  label: BUG_PRIORITY_LABELS[priority],
}));
const COMPONENT_OPTIONS = BUG_COMPONENTS.map((component) => ({
  value: component,
  label: BUG_COMPONENT_LABELS[component],
}));

// Searches half a second after the last change of a field
export const BugSearchForm: FC<BugSearchFormProps> = ({
  onSubmit,
  isLoading,
  onSearchReset,
  repos,
  activeTab,
  assignees = NO_ASSIGNEES,
  defaultFilter = NO_FILTER,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<BugFilter>({ defaultValues: formValuesOf(defaultFilter) });

  const _values = watch();

  const submit: SubmitHandler<BugFilter> = useCallback(
    (data) => {
      onSubmit(data);
      reset(data);
    },
    [onSubmit, reset],
  );
  const search = useMemo(() => handleSubmit(submit), [handleSubmit, submit]);
  useSearchAsTyped(isDirty, search);

  const form: FilterForm = {
    register,
    errors,
    clearField: (fieldName) => {
      setValue(fieldName, "");
      // Submit the form immediately to refresh results
      void search();
    },
    isLoading,
  };
  const isGitHub = activeTab === "github";
  const wide = isGitHub ? { sm: 6, lg: 3 } : { sm: 12, lg: 6 };

  return (
    <Form
      data-testid="bug-search-form"
      onSubmit={search}
      onReset={() => {
        reset(EMPTY_FILTER);
        onSearchReset();
      }}
    >
      <Row className="d-flex align-items-end mb-3">
        <NameFilter form={form} isGitHub={isGitHub} />
        {isGitHub && (
          <FilterSelect
            form={form}
            field="repo"
            label="Repository"
            noun="repository"
            options={repos.map((repo) => ({ value: repo, label: repo }))}
            layout={REPO_LAYOUT}
          />
        )}
        {isGitHub && (
          <FilterSelect
            form={form}
            field="status"
            label="Status"
            noun="status"
            options={STATUS_OPTIONS}
            layout={{ ...REPO_LAYOUT, className: "mt-2 mt-sm-0" }}
          />
        )}
        <FilterSelect
          form={form}
          field="priority"
          label="Priority"
          noun="priority"
          options={PRIORITY_OPTIONS}
          layout={{ ...wide, className: "mt-2 mt-sm-0" }}
        />
        <FilterSelect
          form={form}
          field="component"
          label="Component"
          noun="component"
          options={COMPONENT_OPTIONS}
          layout={SECOND_ROW_LAYOUT}
        />
        {isGitHub && assignees.length > 0 && (
          <FilterSelect
            form={form}
            field="assignee"
            label="Assigned to"
            noun="assignee"
            anyLabel="Anyone"
            options={assignees.map((user) => ({
              value: user.id,
              label: user.name,
            }))}
            layout={SECOND_ROW_LAYOUT}
          />
        )}
      </Row>
    </Form>
  );
};
