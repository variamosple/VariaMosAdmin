import type { ResponseModel } from "@variamosple/variamos-components";
import {
  type FC,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Button, Dropdown, Form, Modal, Spinner } from "react-bootstrap";
import {
  type DefaultValues,
  type SubmitHandler,
  type UseFormRegister,
  type UseFormRegisterReturn,
  useForm,
} from "react-hook-form";
import type { Model } from "@/features/model-management/domain/Entity/Model";

interface ModelFormFields extends Omit<Model, "isPublic" | "languageId"> {
  isPublic?: string;
  languageId?: string | number;
}

export interface ModelFormModalProps {
  modalTitle: string;
  showModal: boolean;
  onClose: () => void;
  defaultValue?: Model;
  onModelSubmit: (model: Model) => Promise<ResponseModel<Model>>;
  isLoading: boolean;
  submitText?: string;
  projects?: { id: string; name: string }[];
  languages?: { id: number; name: string }[];
  /** Searches the projects by name on the server: the list holds one page */
  onProjectSearch?: (name: string) => void;
  /** Searches the languages by name on the server */
  onLanguageSearch?: (name: string) => void;
}

// Pause in the typing before the server is asked
const SEARCH_DELAY_MS = 300;

/**
 * Calls `search` with `term` once the typing pauses, and only when the term
 * differs from the last one searched: opening the form asks nothing.
 */
const useServerSearch = (
  term: string,
  search: ((name: string) => void) | undefined,
) => {
  const lastSearchedRef = useRef("");
  useEffect(() => {
    if (!search || term === lastSearchedRef.current) return;
    const timer = setTimeout(() => {
      lastSearchedRef.current = term;
      search(term);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [term, search]);
};

const NO_PROJECTS: NonNullable<ModelFormModalProps["projects"]> = [];
const NO_LANGUAGES: NonNullable<ModelFormModalProps["languages"]> = [];

// A project or a language picked in a list searched on the server
const usePicker = <Id,>(
  initialId: Id | undefined,
  onSearch: ((name: string) => void) | undefined,
) => {
  const [search, setSearch] = useState("");
  useServerSearch(search, onSearch);
  // The name of the item picked: a later search may leave it out of the list
  const [pickedName, setPickedName] = useState<string>();
  const [selectedId, setSelectedId] = useState<Id | undefined>(initialId);
  // Stable: the form resets the picker when its model changes
  const resetTo = useCallback((id: Id | undefined) => {
    setSelectedId(id);
    setPickedName(undefined);
  }, []);

  return {
    search,
    setSearch,
    pickedName,
    selectedId,
    pick: (id: Id, name: string) => {
      setSelectedId(id);
      setPickedName(name);
      setSearch("");
    },
    resetTo,
  };
};

interface PickerItem<Id> {
  id: Id;
  name: string;
}

interface SearchPickerProps<Id> {
  controlId: string;
  label: string;
  selectedName: string;
  items: PickerItem<Id>[];
  search: string;
  setSearch: (search: string) => void;
  isActive: (id: Id) => boolean;
  onPick: (item: PickerItem<Id>) => void;
  emptyText: string;
  error?: string;
  // The hidden field the form validates
  registration: UseFormRegisterReturn;
}

const SearchPicker = <Id extends string | number>(
  props: SearchPickerProps<Id>,
) => {
  const { search, error } = props;
  const shown = props.items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <Form.Group className="col-12" controlId={props.controlId}>
      <Form.Label className="form-label">{props.label}</Form.Label>
      <Dropdown className="w-100">
        <Dropdown.Toggle
          variant="outline-secondary"
          className={`w-100 text-start d-flex justify-content-between align-items-center ${error ? "is-invalid border-danger text-danger" : ""}`}
        >
          {props.selectedName}
        </Dropdown.Toggle>

        <Dropdown.Menu
          className="w-100"
          style={{ maxHeight: "300px", overflowY: "auto" }}
        >
          <Form.Control
            autoFocus
            className="mx-3 my-2 w-auto"
            placeholder="Type to search..."
            onChange={(e) => props.setSearch(e.target.value)}
            value={search}
          />
          <Dropdown.Divider />
          {shown.map((item) => (
            <Dropdown.Item
              key={item.id}
              active={props.isActive(item.id)}
              onClick={() => props.onPick(item)}
            >
              {item.name}
            </Dropdown.Item>
          ))}
          {shown.length === 0 && (
            <Dropdown.Item disabled>{props.emptyText}</Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown>
      <input type="hidden" {...props.registration} />
      {error === undefined ? null : (
        <div className="text-danger mt-1" style={{ fontSize: "0.875em" }}>
          {error}
        </div>
      )}
    </Form.Group>
  );
};

const DetailFields: FC<{ register: UseFormRegister<ModelFormFields> }> = ({
  register,
}) => (
  <>
    <Form.Group className="col-12" controlId="modelLevel">
      <Form.Label className="form-label">Level</Form.Label>
      <Form.Select className="form-control" {...register("modelLevel")}>
        <option value="domain">Domain Model</option>
        <option value="application">Application Model</option>
      </Form.Select>
    </Form.Group>

    <Form.Group className="col-12" controlId="isPublic">
      <Form.Label className="form-label">Visibility</Form.Label>
      <Form.Select className="form-control" {...register("isPublic")}>
        <option value="true">Public</option>
        <option value="false">Private</option>
      </Form.Select>
    </Form.Group>

    <Form.Group className="col-12" controlId="author">
      <Form.Label className="form-label">Author</Form.Label>
      <Form.Control
        type="text"
        className="form-control"
        placeholder="Model author"
        {...register("author")}
      />
    </Form.Group>

    <Form.Group className="col-12" controlId="description">
      <Form.Label className="form-label">Description</Form.Label>
      <Form.Control
        as="textarea"
        rows={3}
        className="form-control"
        placeholder="Model description"
        {...register("description")}
      />
    </Form.Group>

    <Form.Group className="col-12" controlId="source">
      <Form.Label className="form-label">Source</Form.Label>
      <Form.Control
        as="textarea"
        rows={3}
        className="form-control"
        placeholder="Model source"
        {...register("source")}
      />
    </Form.Group>
  </>
);

const PICKED = { shouldValidate: true, shouldDirty: true };

// A new model is public unless chosen otherwise
const formValuesOf = (model?: Model): DefaultValues<ModelFormFields> => ({
  ...model,
  isPublic: model?.isPublic === undefined ? "true" : String(model.isPublic),
});

const modelOf = (model: Model | undefined, data: ModelFormFields): Model => ({
  ...model,
  ...data,
  isPublic: String(data.isPublic) === "true",
  languageId: data.languageId ? Number(data.languageId) : undefined,
});

const FormButtons: FC<{
  isLoading: boolean;
  submitText: string;
  onCancel: () => void;
}> = ({ isLoading, submitText, onCancel }) => (
  <Modal.Footer>
    <Button
      type="button"
      variant="secondary"
      disabled={isLoading}
      onClick={onCancel}
    >
      Cancel
    </Button>

    <Button variant="primary" type="submit" disabled={isLoading}>
      {isLoading ? (
        <Spinner animation="border" variant="light" size="sm" />
      ) : (
        submitText
      )}
    </Button>
  </Modal.Footer>
);

const NameField: FC<{
  register: UseFormRegister<ModelFormFields>;
  error?: string;
}> = ({ register, error }) => (
  <Form.Group className="col-12" controlId="modelName">
    <Form.Label className="form-label">Name</Form.Label>
    <Form.Control
      type="text"
      className="form-control"
      placeholder="Model name"
      {...register("name", { required: "Model name is required" })}
      isInvalid={Boolean(error)}
    />
    <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
  </Form.Group>
);

type Picker<Id> = ReturnType<typeof usePicker<Id>>;

// The name of the language picked, even when a search left it out
const languageNameOf = (
  languages: PickerItem<number>[],
  language: Picker<number>,
) =>
  languages.find((l) => l.id === language.selectedId)?.name ||
  language.pickedName ||
  (language.selectedId ? `Language #${language.selectedId}` : undefined) ||
  "Select a language...";

// The name of the project picked; the model being edited names its own
const projectNameOf = (
  projects: PickerItem<string>[],
  project: Picker<string>,
  defaultValue: Model | undefined,
) =>
  projects.find((p) => p.id === project.selectedId)?.name ||
  project.pickedName ||
  (project.selectedId === defaultValue?.projectId
    ? defaultValue?.projectName
    : undefined) ||
  "Select a project...";

export const ModelFormModal: FC<ModelFormModalProps> = ({
  modalTitle,
  showModal,
  onClose,
  defaultValue,
  onModelSubmit,
  isLoading,
  submitText = "Edit Model",
  projects = NO_PROJECTS,
  languages = NO_LANGUAGES,
  onProjectSearch,
  onLanguageSearch,
}) => {
  const project = usePicker(defaultValue?.projectId, onProjectSearch);
  const language = usePicker(defaultValue?.languageId, onLanguageSearch);
  const { resetTo: resetProject } = project;
  const { resetTo: resetLanguage } = language;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ModelFormFields>();

  useEffect(() => {
    reset(formValuesOf(defaultValue));
    resetLanguage(defaultValue?.languageId);
    resetProject(defaultValue?.projectId);
  }, [defaultValue, reset, resetLanguage, resetProject]);

  const onSubmit: SubmitHandler<ModelFormFields> = (data) => {
    if (isLoading) return;
    void onModelSubmit(modelOf(defaultValue, data)).then((response) => {
      if (!response.errorCode) {
        reset();
        language.resetTo(undefined);
        project.resetTo(undefined);
      }
    });
  };

  const onCloseModal = () => {
    onClose();
    reset();
    language.resetTo(defaultValue?.languageId);
    project.resetTo(defaultValue?.projectId);
  };

  const titleId = useId();

  return (
    <Modal
      aria-labelledby={titleId}
      show={showModal}
      backdrop={isLoading ? "static" : true}
      onHide={onCloseModal}
    >
      <Modal.Header closeButton={!isLoading}>
        <Modal.Title id={titleId}>{modalTitle}</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body className="d-flex flex-column gap-3">
          <NameField register={register} error={errors.name?.message} />

          {defaultValue?.id ? null : (
            <SearchPicker
              controlId="projectId"
              label="Project"
              selectedName={projectNameOf(projects, project, defaultValue)}
              items={projects}
              search={project.search}
              setSearch={project.setSearch}
              isActive={(id) => project.selectedId === id}
              onPick={(item) => {
                project.pick(item.id, item.name);
                setValue("projectId", item.id, PICKED);
              }}
              emptyText="No projects found"
              error={errors.projectId?.message}
              registration={register("projectId", {
                required: "Project is required",
              })}
            />
          )}

          <SearchPicker
            controlId="languageId"
            label="Language"
            selectedName={languageNameOf(languages, language)}
            items={languages}
            search={language.search}
            setSearch={language.setSearch}
            isActive={(id) => Number(language.selectedId) === id}
            onPick={(item) => {
              language.pick(item.id, item.name);
              setValue("languageId", item.id, PICKED);
            }}
            emptyText="No languages found"
            error={errors.languageId?.message}
            registration={register("languageId", {
              required: "Language is required",
            })}
          />

          <DetailFields register={register} />
        </Modal.Body>

        <FormButtons
          isLoading={isLoading}
          submitText={submitText}
          onCancel={onCloseModal}
        />
      </Form>
    </Modal>
  );
};
