import {
  type ResponseModel,
  useDiscardConfirmation,
  useQuery,
} from "@variamosple/variamos-components";
import { type FC, useEffect, useId, useState } from "react";
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap";
import { type SubmitHandler, useForm } from "react-hook-form";
import type { PersonalInformationUpdate } from "@/features/user-management/domain/Entity/PersonalInformationUpdate";
import { queryCountries } from "@/shared/api/CountriesRepository";
import { ClosingFooter } from "@/shared/components/FormModal/ClosingFooter";
import type { Country } from "@/shared/domain/Entity/Country";
import { useFormHoldsInput } from "@/shared/hooks/useFormHoldsInput";

export interface PersonalInformationUpdateForModalProps {
  onUpdatePersonalInformationSubmit: (
    PersonalInformationUpdate: PersonalInformationUpdate,
  ) => Promise<ResponseModel<void>>;
  showModal: boolean;
  onClose: () => void;
  isLoading: boolean;
  defaultValue?: PersonalInformationUpdate;
}

export const PersonalInformationUpdateForModal: FC<
  PersonalInformationUpdateForModalProps
> = ({
  onUpdatePersonalInformationSubmit,
  showModal,
  onClose,
  isLoading,
  defaultValue,
}) => {
  const {
    data: countries = [],
    isLoading: isLoadingCountries,
    isLoaded: areCountriesLoaded,
    loadData,
  } = useQuery<null, Country[]>({
    queryFunction: queryCountries,
    initialFilter: null,
  });

  const form = useForm<PersonalInformationUpdate>();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = form;
  const holdsInput = useFormHoldsInput(form);
  // A refused update is told in the open modal, the input kept (UX-05)
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit: SubmitHandler<PersonalInformationUpdate> = (data) => {
    if (!isLoading) {
      setServerError(null);
      void onUpdatePersonalInformationSubmit(data).then((response) => {
        if (!response.errorCode) {
          reset();
        } else {
          setServerError(
            response.message || "The information was not updated.",
          );
        }
      });
    }
  };

  const onCloseModal = () => {
    onClose();
    reset();
    setServerError(null);
  };

  // Closing with unsaved input asks first (UX-08)
  const closing = useDiscardConfirmation({
    holdsInput: showModal && holdsInput,
    onClose: onCloseModal,
  });

  useEffect(() => {
    if (showModal && !isLoadingCountries && !areCountriesLoaded) {
      void loadData(null);
    }
  }, [showModal, loadData, isLoadingCountries, areCountriesLoaded]);

  useEffect(() => {
    if (showModal) {
      reset({ ...defaultValue });
    }
  }, [showModal, defaultValue, reset]);

  const titleId = useId();

  return (
    <Modal
      aria-labelledby={titleId}
      show={showModal}
      backdrop={isLoading ? "static" : true}
      onHide={isLoading ? undefined : closing.requestClose}
      keyboard={!isLoading}
    >
      <Modal.Header closeButton={!isLoading}>
        <Modal.Title id={titleId}>Personal information update</Modal.Title>
      </Modal.Header>
      <Form className="w-100" onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body className="d-flex flex-column gap-2">
          {serverError ? (
            <Alert variant="danger" className="mb-0">
              {serverError}
            </Alert>
          ) : null}
          <Form.Group className="w-100" controlId="countryCode">
            <Form.Label className="form-label align-self-start m-0">
              Country
            </Form.Label>

            {isLoadingCountries ? (
              <span className="d-block">Loading Countries...</span>
            ) : (
              <Form.Select
                aria-label="Select your country"
                className="form-control"
                {...register("countryCode")}
                isInvalid={Boolean(errors.countryCode)}
              >
                <option value="">Select your country</option>

                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </Form.Select>
            )}

            <Form.Control.Feedback type="invalid">
              {errors.countryCode?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <ClosingFooter closing={closing}>
            <Button
              type="button"
              variant="secondary"
              disabled={isLoading}
              onClick={closing.requestClose}
            >
              Cancel
            </Button>

            <Button variant="primary" type="submit" disabled={isLoading}>
              {isLoading ? (
                <Spinner animation="border" variant="light" size="sm" />
              ) : (
                "Update Information"
              )}
            </Button>
          </ClosingFooter>
        </Modal.Body>
      </Form>
    </Modal>
  );
};
