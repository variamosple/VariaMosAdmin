import { useQuery, useRouter } from "@variamosple/variamos-components";
import { type FC, useEffect, useState } from "react";
import { Accordion, ButtonGroup, Spinner } from "react-bootstrap";
import {
  Ban,
  CheckCircle,
  DashCircle,
  Key,
  PlusCircle,
  Search,
  TrashFill,
} from "react-bootstrap-icons";
import type { RoleDetails } from "@/features/role-management/domain/Entity/Role";
import { queryUserRolesDetails } from "@/features/user-management/api/UserRoleRepository";
import type { User } from "@/features/user-management/domain/Entity/User";
import { UserRoleFilter } from "@/features/user-management/domain/Entity/UserRoleFilter";
import { DateTime } from "@/shared/components/DateTime";
import { IconButton } from "@/shared/components/IconButton";

export interface UserRowProps {
  user: User;
  onUserResetLink: (user: User) => void;
  onUserDisable: (user: User) => void;
  onUserEnable: (user: User) => void;
  onUserDelete: (user: User) => void;
}

export const UserRowComponent: FC<UserRowProps> = ({
  user,
  onUserResetLink,
  onUserDisable,
  onUserEnable,
  onUserDelete,
}) => {
  const [show, setShow] = useState(false);
  const { navigate } = useRouter();

  const {
    loadData,
    isLoading,
    data = [],
    filter,
    isLoaded,
  } = useQuery<UserRoleFilter, RoleDetails[]>({
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

        <td>
          <DateTime value={user.createdAt} />
        </td>

        <td>
          <DateTime value={user.lastLogin} />
        </td>

        <td className="text-center">
          <ButtonGroup size="sm">
            <IconButton
              variant="primary"
              onClick={() => navigate(`/users/${user.id}`)}
              label="See user details"
              icon={<Search />}
            />

            {user.isEnabled && !user.isDeleted && (
              <IconButton
                variant="secondary"
                onClick={() => onUserResetLink(user)}
                label="Generate password reset link"
                icon={<Key />}
              />
            )}

            {user.isEnabled && !user.isDeleted && (
              <IconButton
                variant="warning"
                onClick={() => onUserDisable(user)}
                label="Disable user"
                icon={<Ban />}
              />
            )}

            {!user.isEnabled && !user.isDeleted && (
              <IconButton
                variant="success"
                onClick={() => onUserEnable(user)}
                label="Enable user"
                icon={<CheckCircle />}
              />
            )}

            {!user.isDeleted && (
              <IconButton
                variant="danger"
                onClick={() => onUserDelete(user)}
                label="Delete user"
                icon={<TrashFill />}
              />
            )}

            <IconButton
              size="sm"
              variant="info"
              onClick={() => setShow((isShown) => !isShown)}
              label="Show/Hide permissions"
              icon={!show ? <PlusCircle /> : <DashCircle />}
            />
          </ButtonGroup>
        </td>
      </tr>

      {show && isLoading && (
        <tr>
          <td colSpan={8}>
            <div className="w-100 text-center my-3">
              <Spinner
                data-testid="loading-spinner"
                animation="border"
                variant="primary"
              />
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

const RolesDetails: FC<RolesDetailsProps> = ({ isLoading, roles }) => {
  if (isLoading) {
    return (
      <div className="w-100 text-center my-3">
        <Spinner
          data-testid="loading-spinner"
          animation="border"
          variant="primary"
        />
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
              {role.permissions?.map((permission) => (
                <div key={permission.id}>{permission.name}</div>
              ))}
            </div>
          </Accordion.Body>
        </Accordion.Item>
      ))}
    </Accordion>
  );
};
