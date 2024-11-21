import { queryUserRolesDetails } from "@/DataProviders/UserRoleRepository";
import { RoleDetails } from "@/Domain/Role/Entity/Role";
import { User } from "@/Domain/User/Entity/User";
import { UserRoleFilter } from "@/Domain/User/Entity/UserRoleFilter";
import { formatDate } from "@/UI/constants";
import { useQuery } from "@/UI/Hooks/useQuery";
import { FC, useEffect, useState } from "react";
import { Accordion, Button, ButtonGroup, Spinner } from "react-bootstrap";
import {
  Ban,
  CheckCircle,
  DashCircle,
  PlusCircle,
  Search,
  TrashFill,
} from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";

export interface UserRowProps {
  user: User;
  onUserDisable: (user: User) => void;
  onUserEnable: (user: User) => void;
  onUserDelete: (user: User) => void;
}

export const UserRowComponent: FC<UserRowProps> = ({
  user,
  onUserDisable,
  onUserEnable,
  onUserDelete,
}) => {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  const { loadData, isLoading, data, filter, isLoaded } = useQuery<
    UserRoleFilter,
    RoleDetails
  >({
    queryFunction: queryUserRolesDetails,
    initialFilter: new UserRoleFilter(user.id),
  });

  useEffect(() => {
    if (show && user.id && !isLoading && !isLoaded) {
      const updated = !filter
        ? new UserRoleFilter(user.id)
        : Object.assign(filter, {
            userId: user.id,
          });

      loadData(updated);
    }
  }, [show, user, loadData, filter, isLoading, isLoaded]);

  return (
    <>
      <tr key={user.id}>
        <td>{user.user}</td>

        <td>{user.name}</td>

        <td>{user.email}</td>

        <td>
          {user.isDeleted ? "deleted" : user.isEnabled ? "active" : "disabled"}
        </td>

        <td>{formatDate(new Date(user.createdAt))}</td>

        <td>{user.lastLogin ? formatDate(new Date(user.lastLogin)) : "N/A"}</td>

        <td className="text-center">
          <ButtonGroup size="sm">
            <Button
              variant="secondary"
              onClick={() => navigate(`/users/${user.id}`)}
              title="See user details"
            >
              <Search />
            </Button>

            {user.isEnabled && (
              <Button
                variant="warning"
                onClick={() => onUserDisable(user)}
                title="Disable user"
              >
                <Ban />
              </Button>
            )}

            {!user.isEnabled && (
              <Button
                variant="success"
                onClick={() => onUserEnable(user)}
                title="Enable user"
              >
                <CheckCircle />
              </Button>
            )}

            {!user.isDeleted && (
              <Button
                variant="danger"
                onClick={() => onUserDelete(user)}
                title="Delete user"
              >
                <TrashFill />
              </Button>
            )}

            <Button
              size="sm"
              onClick={() => setShow((isShown) => !isShown)}
              title="Show/Hide permissions"
            >
              {!show ? <PlusCircle /> : <DashCircle />}
            </Button>
          </ButtonGroup>
        </td>
      </tr>

      {show && isLoading && (
        <tr>
          <td colSpan={8}>
            <div className="w-100 text-center my-3">
              <Spinner animation="border" variant="primary" />
            </div>
          </td>
        </tr>
      )}

      {show && (
        <tr>
          <td colSpan={8}>
            <RolesDetails isLoading={isLoading} roles={data} />
          </td>
        </tr>
      )}
    </>
  );
};

interface RolesDetailsProps {
  isLoading: boolean;
  roles: RoleDetails[];
}

export const RolesDetails: FC<RolesDetailsProps> = ({ isLoading, roles }) => {
  if (isLoading) {
    return (
      <div className="w-100 text-center my-3">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!roles?.length) {
    return <div>No roles found</div>;
  }

  return (
    <Accordion alwaysOpen flush>
      {roles.map((role) => (
        <Accordion.Item key={role.id} eventKey={`${role.id}`}>
          <Accordion.Header>Role: {role.name}</Accordion.Header>

          <Accordion.Body>
            <div
              className="d-grid gap-1"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              }}
            >
              {role.permissions!.map((permission) => (
                <div key={permission.id}>{permission.name}</div>
              ))}
            </div>
          </Accordion.Body>
        </Accordion.Item>
      ))}
    </Accordion>
  );
};
