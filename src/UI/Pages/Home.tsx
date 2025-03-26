import { FC } from "react";
import { Container } from "react-bootstrap";

export const HomePage: FC<unknown> = () => {
  return (
    <Container>
      <article>
        <h1 className="text-primary-color-constrast play-bold">VariaMos</h1>

        <p>
          Welcome to the VariaMos admin module. Please select an option from the
          menu above to start using the application.
        </p>
      </article>
    </Container>
  );
};
