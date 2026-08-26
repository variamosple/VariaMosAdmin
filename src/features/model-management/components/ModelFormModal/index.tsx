import type { ResponseModel } from "@variamosple/variamos-components";
import { type FC, useEffect, useState } from "react";
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
}

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
}) => {
  const [languageSearch, setLanguageSearch] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
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
        }
      });
    }
  };

  const onCloseModal = () => {
    onClose();
    reset();
  };

  const selectedLanguageId = watch("languageId");
  const selectedLanguageName =
    languages.find((l) => l.id === Number(selectedLanguageId))?.name ||
    "Select a language...";

  const isEdit = !!defaultValue?.id;

  return (
    <Modal
      show={showModal}
      backdrop={isLoading ? "static" : true}
      onHide={onCloseModal}
    >
      <Modal.Header closeButton={!isLoading}>
        <Modal.Title>{modalTitle}</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body className="d-flex flex-column gap-3">
          <Form.Group className="col-12" controlId="name">
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
              <Form.Select
                className="form-control"
                {...register("projectId", { required: "Project is required" })}
                isInvalid={!!errors.projectId}
              >
                <option value="">Select a project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {errors.projectId?.message}
              </Form.Control.Feedback>
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
                  placeholder="Type to filter..."
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
