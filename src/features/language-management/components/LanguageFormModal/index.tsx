import type { ResponseModel } from "@variamosple/variamos-components";
import type { FC } from "react";
import { Form } from "react-bootstrap";
import type { DefaultValues } from "react-hook-form";
import { FormModal } from "@/shared/components/FormModal";
import { useFormModal } from "@/shared/hooks/useFormModal";
import type { Language } from "../../domain/Entity/Language";

export interface LanguageFormModalProps {
  modalTitle: string;
  showModal: boolean;
  onClose: () => void;
  defaultValue?: Language;
  onLanguageSubmit: (project: Language) => Promise<ResponseModel<Language>>;
  isLoading: boolean;
  submitText?: string;
}

// A copy: the form never writes into the edited language
const languageFields = (language?: Language): DefaultValues<Language> => ({
  ...language,
});

export const LanguageFormModal: FC<LanguageFormModalProps> = ({
  modalTitle,
  showModal,
  onClose,
  defaultValue,
  onLanguageSubmit,
  isLoading,
  submitText = "Edit Language",
}) => {
  const { form, onSubmit, onCloseModal } = useFormModal<Language, Language>({
    defaultValue,
    toFields: languageFields,
    submit: onLanguageSubmit,
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
      <Form.Group className="col-12" controlId="languageName">
        <Form.Label className="form-label">Name</Form.Label>
        <Form.Control
          type="text"
          className="form-control"
          placeholder="Language name"
          {...register("name", { required: "Language name is required" })}
          isInvalid={Boolean(errors.name)}
        />
        <Form.Control.Feedback type="invalid">
          {errors.name?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="col-12" controlId="stateAccept">
        <Form.Label className="form-label">State</Form.Label>
        <Form.Select
          className="form-control"
          aria-label="State"
          {...register("stateAccept")}
        >
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
        </Form.Select>
      </Form.Group>
    </FormModal>
  );
};
