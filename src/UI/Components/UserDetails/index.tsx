import { User } from "@/Domain/User/Entity/User";
import { FC } from "react";
import { Col, Row } from "react-bootstrap";

export interface RoleListParameters {
  user: User;
}

export const UserDetails: FC<RoleListParameters> = ({ user }) => {
  return (
    <div className="w-100">
      <Row>
        <Col className="col-12 col-md-6">
          <span className="fw-bold">User Id: </span> {user?.id}
        </Col>

        <Col className="col-12 col-md-6">
          <span className="fw-bold">Name: </span> {user?.name}
        </Col>

        <Col className="col-12 col-md-6">
          <span className="fw-bold">User: </span> {user?.user}
        </Col>

        <Col className="col-12 col-md-6">
          <span className="fw-bold">Email: </span> {user?.email}
        </Col>
      </Row>

      <Row className="mt-3">
        <Col className="col-12">
          <h2>Connection information</h2>
        </Col>

        <hr />

        <Col className="col-12 col-md-6">
          <span className="fw-bold">Created At: </span>{" "}
          {new Date(user?.createdAt)?.toISOString?.()}
        </Col>

        <Col className="col-12 col-md-6">
          <span className="fw-bold">Last login date: </span>{" "}
          {user?.lastLogin ? new Date(user?.lastLogin)?.toISOString?.() : ""}
        </Col>

        <Col className="col-12 col-md-6">
          <span className="fw-bold">Status: </span>{" "}
          {user?.isEnabled ? "active" : "disabled"}
        </Col>
      </Row>
    </div>
  );
};
