import { FC } from "react";
import { Tab, Tabs } from "react-bootstrap";

export const About: FC<unknown> = () => {
  return (
    <section className="p-2 p-md-5">
      <article>
        <h1 className="text-primary-color-constrast play-bold">Variamos</h1>

        <p>
          VariaMos is a web-based tool that utilizes micro services to enable
          the specification of product lines by means of multi-language modeling
          approach and the reasoning on these products and product lines by
          means of a generic and multi-solver approach.
        </p>
      </article>

      <Tabs defaultActiveKey="how-it-works" className="mb-3">
        <Tab eventKey="how-it-works" title="How it works">
          <h2 className="text-primary-color-constrast play-regular fs-4">
            How it works
          </h2>

          <p>
            VariaMos manages the creation of projects at the two key levels of
            software product line engineering: domain engineering and
            application engineering.
          </p>

          <p>
            Thus, at the VariaMos allows specifying domain assets at the domain
            level, and system and context assets at the application level. These
            assets are represented through different views that can be federated
            through various mechanisms: traceability, binding, zooming, etc.
            These views are instances of the engineering languages that are (i)
            already available in the tool or (ii) created by the stakeholders.
          </p>

          <p>
            To enable users to create their own engineering languages in a
            straightforward manner, VariaMos propose a graphical and a
            JSON-based strategy to define the concrete and the abstract syntax
            of the new languages, and it also allows specifying its operational
            semantics using CLIF as a pivot language. These languages are then
            used to represent the domain engineering assets in a way that they
            can be analyzed, verified, simulated, configured, and federated to
            create static and dynamic software product lines. All these
            reasoning operations are user-specified and can be defined at the
            level of each language (therefore available on all its instances) or
            customized and tailored to support specific reasoning tasks needed
            for a given model type. These operations, defined in our pivot
            language, are automatically transformed into the languages of a wide
            variety of solvers allowing to solve a great variety of problems
            (SAT, linear programming, constraint programming, logic programming,
            etc.). Thus, the VariaMos framework enables the execution of
            user-defined operations (specified at the language level) over the
            models created by the user, which permits satisficing different
            types of modeling and reasoning expectations.
          </p>

          <p>
            The VariaMos Framework is therefore dynamically extendable to new
            modeling languages, interdependencies among the languages,
            operations over the instances of the languages, and solvers to
            execute these operations, which greatly increases its usefulness in
            both teaching and industrial use cases.
          </p>
        </Tab>

        <Tab eventKey="version-2.0" title="Version 2.0">
          <h2 className="text-primary-color-constrast play-regular fs-4">
            Version 2.0. Java Stand Alone
          </h2>

          <p>
            In the second version of VariaMos, the platform became a little more
            independent, thus eliminating much of the dependence on Eclipse. In
            the present version, we were able to demonstrate how the solution is
            adapted to a client-server architecture, as described in (Mazo Raúl,
            Muñoz-Fernández Juan, Rincón Luisa, Salinesi Camille, Tamura
            Gabriel.VariaMos: an extensible tool for engineering (dynamic)
            product lines. In the XIX International Software Product Line
            Conference (SPLC), Nashville-USA, 2015), in which the solution is
            packaged in an executable file to allow its installation in each of
            the users who wish to use it. However, it was the tedious procedure
            that had to be followed for each user to add a new capabilities (or
            languages) to the platform that limited its growth and prompted its
            creators to think about taking the platform to another level.
          </p>

          <h3 className="text-primary-color-constrast play-regular fs-5">
            Limitations and challenges
          </h3>

          <ul>
            <li>
              On this occasion, extensibility and maintainability, from the
              point of view of complexity in the processes, played against the
              application, thus causing the times to improve or extend it to be
              considerably high.
            </li>

            <li>
              The tedious process that had to be followed to extend the
              capabilities of the platform becomes evident when it was needed
              to, for example, define new dynamic operations. Simplifying the
              process of extending the capabilities of the tool, reducing the
              learning curve to be able to use and extend the tool, and easing
              the tool maintenance process were the main motivations for
              creating version 3.0.
            </li>
          </ul>

          <h3 className="text-primary-color-constrast play-regular fs-5">
            Period
          </h3>

          <p>2014-2018</p>

          <h3 className="text-primary-color-constrast play-regular fs-5">
            Working team
          </h3>

          <p>
            David Henao, Diego Quiroz, Esteban Echavarría, Jose Lopez, Juan
            Carlos Muñoz, Luisa Rincon, Raúl Mazo, Sebastian Monsalve.
          </p>
        </Tab>

        <Tab eventKey="version-3.0" title="Version 3.0">
          <h2 className="text-primary-color-constrast play-regular fs-4">
            Version 3.0. VueJS Web Application
          </h2>

          <p>
            In the third version, a more modern architecture was adopted, but it
            was a monolithic application. Building the platform on web
            technology allowed the platform to mitigate and overcome some
            challenges of maintainability and extensibility when used by users.
            Thus, new capabilities were incorporated into the tool, such as
            control loops for continuous and discrete systems. In addition, a
            framework for fragment-oriented programming was incorporated (Correa
            Daniel, Mazo Raúl, Giraldo Gloria. Extending FragOP Domain Reusable
            Components to Support Product Customization in the Context of
            Software Product Lines. In Proceedings of the ICSR Conference, LNCS
            11602, pp. 17–33, Springer-Verlag, Cincinnati-USA, 2019), which
            promoted the challenge of specifying domain and application
            components, as well as generating a relationship between
            requirements and components that allowed (i) to obtain products not
            only from domain requirements, but also from the code corresponding
            to configured requirements, and (ii) to obtain final products thanks
            to assisted processes of configuration and customization of the
            corresponding domain components.
          </p>

          <p>
            On the other hand, as the number of extensions increased, the rate
            of code duplication also increased and the developers’ discomfort
            grew because they spent more time manipulating the code of the
            VariaMosl’s graphical library than making well-structured code that
            added new value to the tool. Additionally, there was evidence of a
            considerable learning curve for being profitable with MxGraph, the
            tool’s graphics library (used to diagram language objects). In
            addition, VueJS was a growing and instable framework and, at the
            time of this version of VariaMos, the version of the framework was
            changed without backward compatibility. This unexpected change
            implied rewriting almost all the code of VariaMos, and this made us
            think about the great threat to the continuation of the project
            represented by the dependence on a framework.
          </p>

          <h3 className="text-primary-color-constrast play-regular fs-5">
            Limitations and challenges
          </h3>

          <ul>
            <li>
              By duplicating code within an application, not only extensibility
              but also maintainability is affected. This is because when a
              change is required, whether major or minor, the impact it will
              have on the software evolution will be considerable as it will
              require time to analyze the components that must be intervened.
            </li>

            <li>
              The mitigation of code duplication and the lack of structure when
              extending the tool were two of the main motivators for the
              VariaMos team to think about a 4.0 version of VariaMos.
            </li>
          </ul>

          <h3 className="text-primary-color-constrast play-regular fs-5">
            Period
          </h3>

          <p>2014-2019</p>

          <h3 className="text-primary-color-constrast play-regular fs-5">
            Working team
          </h3>

          <p>
            Andrés Erazo, Andrés Lopez, Camilo Correa, Daniel Correa, Esteban
            Echavarría, Yan Wang, Jairo Soto, Luis Fernando Londoño, Paola
            Vallejo, Raúl Mazo.
          </p>
        </Tab>

        <Tab eventKey="version-4.0" title="Version 4.0">
          <h2 className="text-primary-color-constrast play-regular fs-4">
            Version 4.0. A microservices-based Web Application
          </h2>

          <p>
            The fourth version of VariaMos is a microservices-based Web
            application available at https://variamos2024.azurewebsites.net.
            This new version has been entirely rewritten in Typescript and
            utilizes React for the user interface and MxGraph for handling the
            diagrams. The process of creating new engineering languages has been
            reworked, removing the need to directly write code for the MxGraph
            library; instead, user-defined specifications written as JSON files
            coupled to purpose-built graphical interfaces are used to provide
            all the support needed to define modeling languages and to create
            models with these languages. The JSON-based mechanisms for language
            creation now support the definition of the syntax (abstract and
            concrete), the semantics (for different reasoning paradigms and
            languages) and the specification of reasoning tasks for different
            modeling languages. Thanks to these capabilities, VariaMos manages
            the creation of projects at the two key levels of software product
            line engineering: domain engineering and application engineering.
            The newly added reasoning back-end allows for a variety of reasoning
            talks to be performed. Models can be checked for satisfiability and
            defects, one can configure products with and without partial
            configurations, one can perform simulations for dynamic software
            product line models, and one can construct and find solutions to
            optimization problems based on the models. All of these tasks are
            user-specified and can be customized and tailored to support
            specific reasoning tasks needed for a given model type. In addition,
            language developers can consult and inspect the logical
            representation of the models of a given language as they construct
            it, further aiding them in the definition of the semantics.
            Furthermore, this framework enables the execution of user-defined
            operations (specified at the language level) over the models created
            by the user, which permits satisficing different types of modeling
            and reasoning expectations. The VariaMos Framework is therefore
            dynamically extendable to new modeling languages, interdependencies
            among the languages, operations over the instances of the languages,
            and solvers to execute these operations, which greatly increases its
            usefulness in both teaching and industrial use cases.
          </p>

          <h3 className="text-primary-color-constrast play-regular fs-5">
            Period
          </h3>
          <p>2020-present</p>

          <h3 className="text-primary-color-constrast play-regular fs-5">
            Working team
          </h3>

          <p>
            Andrés Lopez, Arthur Pers, Camilo Correa, Deisy Loaiza, Francisco
            Piedrahita, Gabriel Camargo, Hiba Hnaini, Jairo Soto, Jonathan
            Orrego, Julian Murillo, Luis Fernando Londoño, Mauricio Agudelo,
            Paola Vallejo, Sam Nzongani, Raúl Mazo, Viviana Cobaleda, Williams
            Hoarau.
          </p>
        </Tab>
      </Tabs>

      <hr className="w-100" />

      <h2 className="text-primary-color-constrast play-bold fs-4">Tutorials</h2>

      <Tabs defaultActiveKey="PLE" className="mb-3">
        <Tab eventKey="PLE" title="PLE">
          <h3 className="text-primary-color-constrast play-regular fs-5">
            Product line engineering (PLE)
          </h3>

          <ul className="decoration-none">
            <li>
              <a
                href="https://docs.google.com/document/d/1-f0u5pwDDAiOt3u-suUEOJJlQKvtr8y9/edit?usp=drive_link&ouid=106498246296993132947&rtpof=true&sd=true"
                target="_blank"
                rel="noreferrer"
              >
                Tutorial 0 PLE: Creating projects, product lines and products in
                VariaMos
              </a>
            </li>
            <li>
              <a
                href="https://docs.google.com/document/d/1BW-hJU4eUmR3LkAkMEv8L03Yerirj61q/edit?usp=drive_link&ouid=106498246296993132947&rtpof=true&sd=true"
                target="_blank"
                rel="noreferrer"
              >
                Tutorial 1 PLE: Requirements Specification
              </a>
            </li>
            <li>
              <a
                href="https://docs.google.com/document/d/1miE-MQQk3KhlyFxiqae6pauHxU0IXCI3/edit?usp=drive_link&ouid=106498246296993132947&rtpof=true&sd=true"
                target="_blank"
                rel="noreferrer"
              >
                Tutorial 2 PLE: Domain requirements variability modeling
              </a>
            </li>
            <li>
              <a
                href="https://docs.google.com/document/d/1qxECHjz-LcQbY1wLw8uMwpnlMlYANDoo/edit?usp=drive_link&ouid=106498246296993132947&rtpof=true&sd=true"
                target="_blank"
                rel="noreferrer"
              >
                Tutorial 3 PLE: Code generation and solver-specific analysis
              </a>
            </li>
            <li>
              <a
                href="https://docs.google.com/document/d/1tGlfkZhdd-wycMRGhsfM8kwc-oDA904U/edit?usp=drive_link&ouid=106498246296993132947&rtpof=true&sd=true"
                target="_blank"
                rel="noreferrer"
              >
                Tutorial 4 PLE: Automated Verification of Models
              </a>
            </li>
            <li>
              <a
                href="https://docs.google.com/document/d/1vJayYEpG7ErRvZDYb7x9S1gdEL4FTWkV/edit?usp=drive_link&ouid=106498246296993132947&rtpof=true&sd=true"
                target="_blank"
                rel="noreferrer"
              >
                Tutorial 5 PLE: Automated Configuration
              </a>
            </li>
            <li>
              <a
                href="https://docs.google.com/document/d/1c8DECxhEODJrS8EhmrFxhRZWylQqMelr/edit?usp=drive_link&ouid=106498246296993132947&rtpof=true&sd=true"
                target="_blank"
                rel="noreferrer"
              >
                Appendix 1 PLE: Requirements Specification in VariaMos with
                SECRET
              </a>
            </li>
          </ul>
        </Tab>

        <Tab eventKey="MDE" title="MDE">
          <h3 className="text-primary-color-constrast play-regular fs-5">
            Model driven engineering (MDE)
          </h3>

          <ul className="decoration-none">
            <li>
              <a
                href="https://docs.google.com/document/d/1x6HH3DtzIz7IyVK-zxtpmVEL5-1dAdOz/edit?usp=drive_link&ouid=106498246296993132947&rtpof=true&sd=true"
                target="_blank"
                rel="noreferrer"
              >
                Tutorial 1 MDE: Language syntax specification
              </a>
            </li>
            <li>
              <a
                href="https://docs.google.com/document/d/1Hskz18A6XIRm8tLe2obsGxe_9YW7y1Si/edit?usp=drive_link&ouid=106498246296993132947&rtpof=true&sd=true"
                target="_blank"
                rel="noreferrer"
              >
                Tutorial 2 MDE: Language semantic specification
              </a>
            </li>
          </ul>
        </Tab>
      </Tabs>
    </section>
  );
};
