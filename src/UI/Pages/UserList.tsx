import { queryUsers } from "@/DataProviders/UserRepository";
import { User } from "@/Domain/User/Entity/User";
import { UsersFilter } from "@/Domain/User/Entity/UsersFilter";
import { UserList } from "@/UI/Components/UserList";
import { usePaginatedQuery } from "@/UI/Hooks/usePaginatedQuery";
import { FC, useEffect } from "react";
import { Container } from "react-bootstrap";

export const UserListPage: FC<unknown> = () => {
  const {
    data: users,
    currentPage,
    loadData,
    totalPages,
    onPageChange,
  } = usePaginatedQuery<UsersFilter, User>({
    queryFunction: queryUsers,
    initialFilter: new UsersFilter(),
  });

  useEffect(() => {
    loadData(new UsersFilter());
  }, [loadData]);

  return (
    <Container fluid="sm" className="my-2">
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
