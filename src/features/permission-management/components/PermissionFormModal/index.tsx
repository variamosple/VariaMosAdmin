import type { ResponseModel } from "@variamosple/variamos-components";
import type { FC } from "react";
import { Form } from "react-bootstrap";
import type { DefaultValues } from "react-hook-form";
import {
  PERMISSION_NAME_PATTERN,
  type Permission,
} from "@/features/permission-management/domain/Entity/Permission";
import { FormModal } from "@/shared/components/FormModal";
import { useFormModal } from "@/shared/hooks/useFormModal";

export interface PermissionFormModalProps {
  modalTitle: string;
  showModal: boolean;
  onClose: () => void;
  defaultValue?: Permission;
  onPermissionSubmit: (
    permission: Permission,
  ) => Promise<ResponseModel<Permission>>;
  isLoading: boolean;
  submitText?: string;
}

// A copy: the form never writes into the edited permission
const permissionFields = (
  permission?: Permission,
): DefaultValues<Permission> => ({
  ...permission,
});

export const PermissionFormModal: FC<PermissionFormModalProps> = ({
  modalTitle,
  showModal,
  onClose,
  defaultValue,
  onPermissionSubmit,
  isLoading,
  submitText = "Create permission",
}) => {
  const { form, onSubmit, onCloseModal } = useFormModal<Permission, Permission>(
    {
      defaultValue,
      toFields: permissionFields,
      submit: onPermissionSubmit,
      isLoading,
      onClose,
    },
  );
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
      <Form.Group className="col-6 col-md-4" controlId="name">
        <Form.Label className="form-label">Permission name</Form.Label>
        <Form.Control
          type="text"
          className="form-control"
          placeholder="Permission name"
          {...register("name", {
            required: "Permission name is required",
            pattern: {
              value: PERMISSION_NAME_PATTERN,
              message:
                "Use 'resource::action' or 'module::resource::action': lowercase letters, digits and hyphens (e.g. 'users::query').",
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
