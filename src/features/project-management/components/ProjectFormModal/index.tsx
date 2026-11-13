import type { ResponseModel } from "@variamosple/variamos-components";
import type { FC } from "react";
import { Form } from "react-bootstrap";
import type { DefaultValues } from "react-hook-form";
import type { Project } from "@/features/project-management/domain/Entity/Project";
import { FormModal } from "@/shared/components/FormModal";
import { useFormModal } from "@/shared/hooks/useFormModal";

interface ProjectFormFields extends Omit<Project, "template"> {
  template?: string;
}

// The template flag goes through a select, as the string "true" or "false"
const projectFields = (
  project?: Project,
): DefaultValues<ProjectFormFields> => ({
  ...project,
  template:
    project?.template !== undefined ? String(project.template) : "false",
});

export interface ProjectFormModalProps {
  modalTitle: string;
  showModal: boolean;
  onClose: () => void;
  defaultValue?: Project;
  onProjectSubmit: (project: Project) => Promise<ResponseModel<Project>>;
  isLoading: boolean;
  submitText?: string;
}

export const ProjectFormModal: FC<ProjectFormModalProps> = ({
  modalTitle,
  showModal,
  onClose,
  defaultValue,
  onProjectSubmit,
  isLoading,
  submitText = "Edit Project",
}) => {
  const { form, onSubmit, onCloseModal } = useFormModal<
    ProjectFormFields,
    Project
  >({
    defaultValue,
    toFields: projectFields,
    submit: (data) => {
      let template = false;
      if (data?.template !== undefined && data?.template !== null) {
        template = String(data.template) === "true";
      } else if (defaultValue?.template !== undefined) {
        template = defaultValue.template;
      }

      const updatedProject: Project = {
        ...defaultValue,
        ...data,
        template,
      };

      return onProjectSubmit(updatedProject);
    },
    isLoading,
    onClose,
  });
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <FormModal
      title={modalTitle}
      show={showModal}
      isLoading={isLoading}
      submitText={submitText}
      onClose={onCloseModal}
      onSubmit={onSubmit}
      bodyClassName="d-flex flex-column gap-3"
    >
      <Form.Group className="col-12" controlId="projectName">
        <Form.Label className="form-label">Name</Form.Label>
        <Form.Control
          type="text"
          className="form-control"
          placeholder="Project name"
          {...register("name", { required: "Project name is required" })}
          isInvalid={Boolean(errors.name)}
        />
        <Form.Control.Feedback type="invalid">
          {errors.name?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="col-12" controlId="template">
        <Form.Label className="form-label">Access level</Form.Label>
        <Form.Select
          className="form-control"
          aria-label="Access level"
          {...register("template")}
        >
          <option value="false">Private</option>
          <option value="true">Public</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="col-12" controlId="author">
        <Form.Label className="form-label">Author</Form.Label>
        <Form.Control
          type="text"
          className="form-control"
          placeholder="Project author"
          {...register("author")}
        />
      </Form.Group>

      <Form.Group className="col-12" controlId="description">
        <Form.Label className="form-label">Description</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          className="form-control"
          placeholder="Project description"
          {...register("description")}
        />
      </Form.Group>

      <Form.Group className="col-12" controlId="source">
        <Form.Label className="form-label">Source</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          className="form-control"
          placeholder="Project source"
          {...register("source")}
        />
      </Form.Group>
    </FormModal>
  );
};
