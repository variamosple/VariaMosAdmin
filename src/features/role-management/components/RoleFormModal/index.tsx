import type { ResponseModel } from "@variamosple/variamos-components";
import type { FC } from "react";
import { Form } from "react-bootstrap";
import type { DefaultValues } from "react-hook-form";
import {
  ROLE_NAME_PATTERN,
  type Role,
} from "@/features/role-management/domain/Entity/Role";
import { FormModal } from "@/shared/components/FormModal";
import { useFormModal } from "@/shared/hooks/useFormModal";

export interface RoleFormModalProps {
  modalTitle: string;
  showModal: boolean;
  onClose: () => void;
  defaultValue?: Role;
  onRoleSubmit: (role: Role) => Promise<ResponseModel<Role>>;
  isLoading: boolean;
  submitText?: string;
}

// A copy: the form never writes into the edited role
const roleFields = (role?: Role): DefaultValues<Role> => ({
  ...role,
});

export const RoleFormModal: FC<RoleFormModalProps> = ({
  modalTitle,
  showModal,
  onClose,
  defaultValue,
  onRoleSubmit,
  isLoading,
  submitText = "Create role",
}) => {
  const { form, onSubmit, onCloseModal } = useFormModal<Role, Role>({
    defaultValue,
    toFields: roleFields,
    submit: onRoleSubmit,
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
    >
      <Form.Group controlId="name" className="col-12 col-md-8">
        <Form.Label className="form-label ">Role name</Form.Label>
        <Form.Control
          type="text"
          className="form-control "
          placeholder="Role name"
          {...register("name", {
            required: "Role name is required",
            pattern: {
              value: ROLE_NAME_PATTERN,
              message:
                "Start with a capital letter, then lowercase words separated by single spaces (e.g. 'Test role').",
            },
          })}
          isInvalid={Boolean(errors.name)}
        />
        <Form.Control.Feedback type="invalid">
          {errors.name?.message}
        </Form.Control.Feedback>
      </Form.Group>
    </FormModal>
  );
};
