import type { ResponseModel } from "@variamosple/variamos-components";
import { type FC, useEffect, useId, useRef, useState } from "react";
import { Button, Dropdown, Form, Modal, Spinner } from "react-bootstrap";
import { type SubmitHandler, useForm } from "react-hook-form";
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
  const lastSearched = useRef("");
  useEffect(() => {
    if (!search || term === lastSearched.current) return;
    const timer = setTimeout(() => {
      lastSearched.current = term;
      search(term);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [term, search]);
};

export const ModelFormModal: FC<ModelFormModalProps> = ({
  modalTitle,
  showModal,
  onClose,
  defaultValue,
  onModelSubmit,
  isLoading,
  submitText = "Edit Model",
  projects = [],
  languages = [],
  onProjectSearch,
  onLanguageSearch,
}) => {
  const [languageSearch, setLanguageSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  useServerSearch(projectSearch, onProjectSearch);
  useServerSearch(languageSearch, onLanguageSearch);
  // Names of the items picked: a later search may leave them out of the list
  const [pickedProjectName, setPickedProjectName] = useState<string>();
  const [pickedLanguageName, setPickedLanguageName] = useState<string>();
  const [selectedLanguageId, setSelectedLanguageId] = useState<
    number | undefined
  >(defaultValue?.languageId);
  const [selectedProjectId, setSelectedProjectId] = useState<
    string | undefined
  >(defaultValue?.projectId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ModelFormFields>();

  useEffect(() => {
    reset({
      ...defaultValue,
      isPublic:
        defaultValue?.isPublic !== undefined
          ? String(defaultValue.isPublic)
          : "true",
    });
    setSelectedLanguageId(defaultValue?.languageId);
    setSelectedProjectId(defaultValue?.projectId);
    setPickedLanguageName(undefined);
    setPickedProjectName(undefined);
  }, [defaultValue, reset]);

  const onSubmit: SubmitHandler<ModelFormFields> = (data) => {
    if (!isLoading) {
      const formattedData: Model = {
        ...defaultValue,
        ...data,
        isPublic: String(data.isPublic) === "true",
        languageId: data.languageId ? Number(data.languageId) : undefined,
      } as Model;
      onModelSubmit(formattedData).then((response) => {
        if (!response.errorCode) {
          reset();
          setSelectedLanguageId(undefined);
          setSelectedProjectId(undefined);
          setPickedLanguageName(undefined);
          setPickedProjectName(undefined);
        }
      });
    }
  };

  const onCloseModal = () => {
    onClose();
    reset();
    setSelectedLanguageId(defaultValue?.languageId);
    setSelectedProjectId(defaultValue?.projectId);
    setPickedLanguageName(undefined);
    setPickedProjectName(undefined);
  };

  const selectedLanguageName =
    languages.find((l) => l.id === selectedLanguageId)?.name ||
    pickedLanguageName ||
    (selectedLanguageId ? `Language #${selectedLanguageId}` : undefined) ||
    "Select a language...";

  const selectedProjectName =
    projects.find((p) => p.id === selectedProjectId)?.name ||
    pickedProjectName ||
    (selectedProjectId === defaultValue?.projectId
      ? defaultValue?.projectName
      : undefined) ||
    "Select a project...";

  const isEdit = !!defaultValue?.id;

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
          <Form.Group className="col-12" controlId="modelName">
            <Form.Label className="form-label">Name</Form.Label>
            <Form.Control
              type="text"
              className="form-control"
              placeholder="Model name"
              {...register("name", { required: "Model name is required" })}
              isInvalid={!!errors.name}
            />
            <Form.Control.Feedback type="invalid">
              {errors.name?.message}
            </Form.Control.Feedback>
          </Form.Group>

          {!isEdit && (
            <Form.Group className="col-12" controlId="projectId">
              <Form.Label className="form-label">Project</Form.Label>
              <Dropdown className="w-100">
                <Dropdown.Toggle
                  variant="outline-secondary"
                  className={`w-100 text-start d-flex justify-content-between align-items-center ${errors.projectId ? "is-invalid border-danger text-danger" : ""}`}
                >
                  {selectedProjectName}
                </Dropdown.Toggle>

                <Dropdown.Menu
                  className="w-100"
                  style={{ maxHeight: "300px", overflowY: "auto" }}
                >
                  <Form.Control
                    autoFocus
                    className="mx-3 my-2 w-auto"
                    placeholder="Type to search..."
                    onChange={(e) => setProjectSearch(e.target.value)}
                    value={projectSearch}
                  />
                  <Dropdown.Divider />
                  {projects
                    .filter((p) =>
                      p.name
                        .toLowerCase()
                        .includes(projectSearch.toLowerCase()),
                    )
                    .map((p) => (
                      <Dropdown.Item
                        key={p.id}
                        active={selectedProjectId === p.id}
                        onClick={() => {
                          setSelectedProjectId(p.id);
                          setPickedProjectName(p.name);
                          setValue("projectId", p.id, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                          setProjectSearch("");
                        }}
                      >
                        {p.name}
                      </Dropdown.Item>
                    ))}
                  {projects.filter((p) =>
                    p.name.toLowerCase().includes(projectSearch.toLowerCase()),
                  ).length === 0 && (
                    <Dropdown.Item disabled>No projects found</Dropdown.Item>
                  )}
                </Dropdown.Menu>
              </Dropdown>
              <input
                type="hidden"
                {...register("projectId", { required: "Project is required" })}
              />
              {errors.projectId && (
                <div
                  className="text-danger mt-1"
                  style={{ fontSize: "0.875em" }}
                >
                  {errors.projectId.message}
                </div>
              )}
            </Form.Group>
          )}

          <Form.Group className="col-12" controlId="languageId">
            <Form.Label className="form-label">Language</Form.Label>
            <Dropdown className="w-100">
              <Dropdown.Toggle
                variant="outline-secondary"
                className={`w-100 text-start d-flex justify-content-between align-items-center ${errors.languageId ? "is-invalid border-danger text-danger" : ""}`}
              >
                {selectedLanguageName}
              </Dropdown.Toggle>

              <Dropdown.Menu
                className="w-100"
                style={{ maxHeight: "300px", overflowY: "auto" }}
              >
                <Form.Control
                  autoFocus
                  className="mx-3 my-2 w-auto"
                  placeholder="Type to search..."
                  onChange={(e) => setLanguageSearch(e.target.value)}
                  value={languageSearch}
                />
                <Dropdown.Divider />
                {languages
                  .filter((l) =>
                    l.name.toLowerCase().includes(languageSearch.toLowerCase()),
                  )
                  .map((l) => (
                    <Dropdown.Item
                      key={l.id}
                      active={Number(selectedLanguageId) === l.id}
                      onClick={() => {
                        setSelectedLanguageId(l.id);
                        setPickedLanguageName(l.name);
                        setValue("languageId", l.id, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        setLanguageSearch("");
                      }}
                    >
                      {l.name}
                    </Dropdown.Item>
                  ))}
                {languages.filter((l) =>
                  l.name.toLowerCase().includes(languageSearch.toLowerCase()),
                ).length === 0 && (
                  <Dropdown.Item disabled>No languages found</Dropdown.Item>
                )}
              </Dropdown.Menu>
            </Dropdown>
            <input
              type="hidden"
              {...register("languageId", { required: "Language is required" })}
            />
            {errors.languageId && (
              <div className="text-danger mt-1" style={{ fontSize: "0.875em" }}>
                {errors.languageId.message}
              </div>
            )}
          </Form.Group>

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
        </Modal.Body>

        <Modal.Footer>
          <Button
            type="button"
            variant="secondary"
            disabled={isLoading}
            onClick={onCloseModal}
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
      </Form>
    </Modal>
  );
};
