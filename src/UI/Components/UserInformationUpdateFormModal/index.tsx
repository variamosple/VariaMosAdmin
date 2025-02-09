import { queryCountries } from "@/DataProviders/CountriesRepository";
import { ResponseModel } from "@/Domain/Core/Entity/ResponseModel";
import { Country } from "@/Domain/Country/Country";
import { PersonalInformationUpdate } from "@/Domain/User/Entity/PersonalInformationUpdate";
import { useQuery } from "@/UI/Hooks/useQuery";
import { FC, useEffect } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import { SubmitHandler, useForm } from "react-hook-form";

export interface PersonalInformationUpdateForModalProps {
  onUpdatePersonalInformationSubmit: (
    PersonalInformationUpdate: PersonalInformationUpdate
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
  } = useQuery<unknown, Country[]>({
    queryFunction: queryCountries,
    initialFilter: null,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PersonalInformationUpdate>();

  const onSubmit: SubmitHandler<PersonalInformationUpdate> = (data) => {
    if (!isLoading) {
      onUpdatePersonalInformationSubmit(data).then((response) => {
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

  useEffect(() => {
    if (showModal && !isLoadingCountries && !areCountriesLoaded) {
      loadData(null);
    }
  }, [showModal, loadData, isLoadingCountries, areCountriesLoaded]);

  useEffect(() => {
    if (showModal) {
      reset({ ...defaultValue });
    }
  }, [showModal, defaultValue, reset]);

  return (
    <Modal
      show={showModal}
      backdrop={isLoading ? "static" : true}
      onHide={onCloseModal}
    >
      <Modal.Header closeButton={!isLoading}>
        <Modal.Title>PersonalInformation update</Modal.Title>
      </Modal.Header>
      <Form className="w-100" onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body className="d-flex flex-column gap-2">
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
                isInvalid={!!errors.countryCode}
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
                "Update Information"
              )}
            </Button>
          </Modal.Footer>
        </Modal.Body>
      </Form>
    </Modal>
  );
};
