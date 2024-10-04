import { queryUserById } from "@/DataProviders/UserRepository";
import { User } from "@/Domain/User/Entity/User";
import { FC, useEffect, useState } from "react";
import { Button, Container, Spinner } from "react-bootstrap";
import { ArrowLeft } from "react-bootstrap-icons";
import { useNavigate, useParams } from "react-router-dom";
import { UserDetails } from "../Components/UserDetails";

export const UserDetailsPage: FC<unknown> = () => {
  const navigate = useNavigate();
  const { userId: userIdParam } = useParams();
  const [user, setUser] = useState<User>();
  const [isLoading, setIsLoading] = useState(false);

  const queryUser = (userId: string) => {
    setIsLoading(true);
    queryUserById(userId)
      .then((response) => {
        setUser(response.data);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (userIdParam) {
      queryUser(userIdParam);
    }
  }, [userIdParam]);

  if (isLoading) {
    return (
      <Container fluid="sm" className="my-2">
        <div className="w-100 text-center my-3">
          <Spinner animation="border" variant="primary" />
        </div>
      </Container>
    );
  }

  return (
    <Container fluid="sm" className="my-2">
      <div className="d-flex justify-content-between align-items-end">
        <h1 className="mb-0">User information</h1>

        <div>
          <Button onClick={() => navigate("/users")}>
            <ArrowLeft /> Back To User List
          </Button>
        </div>
      </div>

      <hr />

      {!!user && <UserDetails user={user} />}
    </Container>
  );
};
