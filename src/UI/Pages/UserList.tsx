import { FC, useCallback, useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { queryUsers } from "../../DataProviders/UserRepository";
import { User } from "../../Domain/User/Entity/User";
import { UsersFilter } from "../../Domain/User/Entity/UsersFilter";
import { UserList } from "../Components/UserList";

export const UserListPage: FC<unknown> = () => {
  const [isLoading, setIsloading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState<User[]>([]);
  const [usersFilter, setUsersFilter] = useState(new UsersFilter());
  const [totalPages, setTotalPages] = useState(1);

  const loadUsers = useCallback((filter: UsersFilter = new UsersFilter()) => {
    setUsersFilter(filter);
    setIsloading(true);

    queryUsers(filter)
      .then((response) => {
        setUsers(response.data ?? []);
        setTotalPages(Math.ceil((response.totalCount || 0) / 20));
      })
      .finally(() => {
        setIsloading(false);
      });
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const onPageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    loadUsers(
      Object.assign(new UsersFilter(), usersFilter, {
        pageNumber,
      })
    );
  };

  return (
    <Container>
      <h1>Users list</h1>
      <hr />

      <UserList
        items={users}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={onPageChange}
      />
    </Container>
  );
};
