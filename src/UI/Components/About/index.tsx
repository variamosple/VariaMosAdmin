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

        <Tab
          eventKey="version-1.0"
          title="Version 1.0"
          className="text-justify"
        >
          <h2 className="text-primary-color-constrast play-regular fs-4">
            VariaMos (Variability Models) V1.0.
          </h2>

          <p>
            The first version of VariaMos was developed by Raúl Mazo and
            released in 2011 as an Eclipse plug-in for specification, automatic
            integration, verification, analysis, configuration and integration
            of multi-view product line models and it was presented, by the first
            time, at the CAiSE’12 (
            <em>
              VariaMos: a Tool for Product Line Driven Systems Engineering with
              a Constraint Based Approach
            </em>
            ).
          </p>

          <p>
            From a deployment point of view, VariaMos 1.0 is an Eclipse plug-in
            that communicates with our GNU Prolog by means of a socket as
            presented in Figure 1.
          </p>

          <figure className="text-center">
            <img
              className="col-12 col-lg-8 col-xl-8"
              src="images/variamos_1.0_deployment.png"
              alt="Deployment diagram of VariaMos 1.0."
            />
            <figcaption>
              <strong>Figure 1:</strong> Deployment diagram of VariaMos 1.0.
            </figcaption>
          </figure>

          <p>
            VariaMos 1.0 allows working simultaneously on a set of models in
            multi-formalisms mode. There are several activities that VariaMos is
            intended to support: domain engineering with multiple models,
            integrated verification of the verification criteria existing in
            literature, analysis and configuration. Some of the capabilities
            supported by our tool are the following:
          </p>

          <ol>
            <li>
              Create/edit a PLM that has been imported as a SPLOT XMI or a
              constraint program text file.
            </li>
            <li>
              Export and import PLMs using a XMI or a constraint program file.
              This functionality allows communicating models from and to other
              applications.
            </li>
            <li>
              Interact with our GNU Prolog solver in order to verify, analyze
              and automatic configure product line models.
            </li>
            <li>
              Transform product line models represented in SPLOT XMI files to
              GNU Prolog.
            </li>
            <li>
              Integrate different views of a product line model in a unique
              product line model represented in GNU Prolog.
            </li>
          </ol>

          <h3 className="text-primary-color-constrast play-regular fs-5">
            1. Integration of Variability Models by means of Constraint Programs
          </h3>

          <p>
            In VariaMos 1.0, each view of the product line system is transformed
            into a constraint program. A constraint program is a collection of
            constraints without a specific order. In this way, the constraint
            programs, representing the different views of the PL system, can be
            easily integrated into a single constraint program. The resulted
            constraint program represents the general system and offers a richer
            view of the PL (than individual views). VariaMos implements the five
            integration strategies presented by Mazo et al. (Constraints: the
            Heart of Domain and Application Engineering in the Product Lines
            Engineering Strategy. International Journal of Information System
            Modeling and Design IJISMD, Vol. 3, No. 2, 2012). In VariaMos 1.0,
            two models’ elements referring to the same concept must have the
            same name; it does not deal with mismatching of names. In Figure 2,
            we show the transformation of two variability models into two
            constraint programs (<em>pl1</em> represented as a feature model and{" "}
            <em>pl2</em> represented as a OVM model) and next its integration
            into a single constraint program (<em>plGeneral</em>) using the
            disjunctive integration strategy. In a disjunctive integration
            strategy, the resulting model allows configuring the products
            presented on one of the input models by using the reusable elements
            and attributes of one of the particular models but not these of the
            other one.
          </p>

          <figure className="text-center">
            <img
              className="col-12 col-xl-5"
              src="images/variamos_1.0_integration_process_example.png"
              alt="Integration process example of two
              variability models in VariaMos 1.0."
            />
            <figcaption>
              <strong>Figure 2:</strong> Integration process example of two
              variability models in VariaMos 1.0.
            </figcaption>
          </figure>

          <p>
            A snapshot of the interface to transform and integrate different
            views of a PLM into a GNU Prolog program is presented Figure 3.
          </p>

          <figure className="text-center">
            <img
              className="col-12 col-xl-10"
              src="images/variamos_1.0_PLM_transformations_gui.png"
              alt="Graphical user interface for PLM
              transformations to GNU Prolog and integration in a GNU Prolog
              file."
            />
            <figcaption>
              <strong>Figure 3:</strong> Graphical user interface for PLM
              transformations to GNU Prolog and integration in a GNU Prolog
              file.
            </figcaption>
          </figure>

          <p>
            Using this PL constraint program, we will show in the next
            sub-section how to verify, analyze and configure the multi-view
            variability models transformed and integrated with the functions
            presented in this section.
          </p>

          <h3 className="text-primary-color-constrast play-regular fs-5">
            2. Integration of Variability Models by means of Constraint Programs
          </h3>

          <p>
            VariaMos 1.0 implements the typology of verification criteria
            presented by Mazo et al. (2012). Using this classification VariaMos
            can detect if the model is void, if the model is not a false PLM, if
            the model does not have errors (e.g., dead features, wrong
            cardinality boundaries, inconsistencies like full-mandatory features
            requiring optional features, and redundancies like full-mandatory
            features included by another feature or inclusion of a relative
            father). Un snapshot of the graphical user interface of VariaMos to
            implement these verification operations is presented in Figure 4.
          </p>

          <figure className="text-center">
            <img
              className="col-12 col-xl-10"
              src="images/variamos_1.0_verification_gui.png"
              alt="Verification GUI of VariaMos"
            />
            <figcaption>
              <strong>Figure 4:</strong> Verification GUI of VariaMos
            </figcaption>
          </figure>

          <p>
            Thus, for example, if we want to know if a PLM, represented in GNU
            Prolog as:
          </p>

          <pre>
            {`pl(L):- 
L = [A, B, C, D],
fd_domain([A,B], 0, 1),
fd_domain([C,D], 0, 5),
A #< B,
C #>= D,
fd_labeling(L).`}
          </pre>

          <p>
            is void or not, VariaMos request the GNU Prolog solver [4] for one
            solution:
          </p>

          <pre>|? - pl(L).</pre>

          <p>
            and due to the fact that the solver gives one solution (i.e.,{" "}
            <pre className="d-inline">L = [0,1,0,0])</pre>, VariaMos concludes
            that the model is not void.
          </p>

          <h3 className="text-primary-color-constrast play-regular fs-5">
            3. Execution of Analysis Operations
          </h3>

          <p>
            All the analysis operations implemented in VariaMos 1.0 are taken
            from literature and from industrial projects with our partners as
            presented in (Mazo R. A Generic Approach for Automated Verification
            of Product Line Models. Ph.D. Thesis, Université Paris 1 Panthéon -
            Sorbonne. Paris France, 2011). A small description of each analysis
            operation implemented in VariaMos and how they have been implemented
            are presented as follows:
          </p>

          <ol>
            <li>
              Calculating the number of valid products represented by the PLM.
              This operation may be useful for determining the richness of a
              PLM. VaroaMos implements this operation with GNU Prolog in the
              following way:{" "}
              <pre className="d-inline">
                g_assign(cpt,0), pl(_), g_inc(cpt), fail;g_read(cpt,N)
              </pre>
              , where <pre className="d-inline">pl</pre> is the fact that
              represents the product line model. With this operationalization we
              avoid the overload of the RAM with each solution generated and
              counted by the solver because each time a solution is found, we
              release the pile of solutions before the generation of a new one.
            </li>

            <li>
              Obtaining the list of <em>all valid products</em> represented by
              the PLM, if any exist. This operation may be useful to compare two
              product line models. The list of valid products is obtained one by
              one from the solver by means of the backtracking technique. As the
              screenshot shows it in Figure 6, VariaMos provides users with the
              possibility to navigate in the list of products using the{" "}
              <em>Next</em> and <em>Previous</em> buttons.
            </li>

            <li>
              Calculating product line commonality. This is the ratio between
              the number of products in which the set of variables of the PLM is
              present and the number of products represented in the PLM. This
              operation calculates the number of solutions in which all the
              variables of the PL are present and divides this number with the
              result obtained with operation 1.
            </li>

            <li>
              Calculating Homogeneity: a number that provides an indication of
              the degree to which the PLM is homogeneous. A more homogeneous PLM
              would be one with few unique variables in one product (i.e., a
              unique variable appears only in one product) while a less
              homogeneous one would be one with a lot of unique variables. By
              definition,{" "}
              <pre className="d-inline">
                Homogeneity = 1 - (#unicVariables / #products)
              </pre>
              . This operation computes the number of variables that appear in
              only one product by means of a request to the solver and computes
              the number of products using the operation 1.
            </li>

            <li>
              Calculating variability factor: This operation takes a PLM as
              input and returns the ratio between the number of products and 2^n
              where n is the number of variables considered. In particular, 2^n
              is the potential number of products represented by a PLM, assuming
              that there are not cross-tree constraint on the model and that all
              PLM’s variables are Boolean.{" "}
              <pre className="d-inline">
                Variability factor = NProd / 2^NVar
              </pre>
              . This function uses the solver to compute the number of variables
              and the number of products in the PLM.
            </li>

            <li>
              Checking validity of a configuration. A configuration is a
              collection of variables and may be partial or total (e.g., the
              partial configuration presented in Figure 5). A valid partial
              configuration is a collection of variables respecting the
              constraints of the PLM but not necessary representing a valid
              product. A total configuration is a collection of variables
              respecting the constraints of a PLM and where no more variables
              need to be added to form a valid product. This operation may be
              useful to determine if there are or not contradictions in a
              collection of variables or to determine whether a given product is
              available in a product line. To operationalize this function, the
              configuration to check is considered as a collection of external
              constraints where each constraint corresponds to the assignation
              of a particular value to each one of the variables of the PLM.
              Then, the external constrains and the constraints of the PLM are
              executed together in the solver to verify if the whole of
              constraints is consistent (i.e., there is a valid solution
              satisfying all these constraints).
            </li>

            <li>
              Executing dependency analysis or decision propagation. It looks
              for all the possible solutions after assigning some fix value to a
              collection of values and then asking the solver for almost one
              solution. This operation is very similar to the operation 6,
              however, with this operation we can check the satisfaction of
              constraints by means of reification, and not only the satisfaction
              of variables of the product line as in operation 5.
            </li>

            <li>
              Specifying external requirements specifications for configurations
              using constraints. This operation allows the specification of
              constraints that are not constraints of the domain, but
              configuration constraints. To operationalize this function,
              external constraints are defined in GNU Prolog and then added to
              the constraints of the PLM; once added, all the constraints are
              executed in the solver. See (Mazo, 2011) for more details and
              Figure 5 for a snapshot of the implementation of this function in
              VariaMos.
            </li>

            <li>
              <p>
                Applying a filter. This operation takes a configuration (i.e.,
                set of variables, each one with a particular value) and a
                collection of external requirements and returns the set of
                products which include the input configuration and respect the
                PLM’s constraints and the external constraints. Figure 5
                presents a snapshot of the GUI of this function in VariaMos.
              </p>

              <figure className="text-center">
                <img
                  className="col-12 col-lg-12 col-xl-8 col-2xl-6"
                  src="images/variamos_1.0_requirements_specification.png"
                  alt="Requirements specification in order to create a filter"
                />

                <figcaption>
                  <strong>Figure 5:</strong> Requirements specification in order
                  to create a filter with a certain configuration and
                  supplementary constraints.
                </figcaption>
              </figure>
            </li>

            <li>
              Calculating the number of products after applying a filter. This
              operation uses the technique presented in operation 1 to compute
              the number of products that can be configured from a PLM in
              presence of a filter. A filter is presented as a collection of
              external constraints and particular assignation of values to the
              variables of the PL. To operationalize this function, the filter
              is added to the collection of the PLM’s constraints and then
              executed in the solver. Figure 6 presents a snapshot of the GUI of
              this function in VariaMos.
            </li>

            <li>
              <p>
                Find an optimal product with respect to a given attribute like
                cost (<pre className="d-inline">min goal</pre>) and benefit (
                <pre className="d-inline">max goal</pre>). Detection of
                “optimal” products is very important for decision makers as
                presented in (Mazo, 2011). To operationalize this function we
                use the
                <pre className="d-inline">fd_maximize</pre> and the{" "}
                <pre className="d-inline">fd_minimize</pre> facts offered by the
                GNU Prolog solver.
              </p>

              <figure className="text-center">
                <img
                  className="col-12 col-lg-12 col-xl-8 col-2xl-6"
                  src="images/variamos_1.0_analysis_functions.png"
                  alt="Some analysis functions implemented in VariaMos"
                />

                <figcaption>
                  <strong>Figure 6:</strong> Some analysis functions implemented
                  in VariaMos
                </figcaption>
              </figure>
            </li>
          </ol>

          <h3 className="text-primary-color-constrast play-regular fs-5">
            4. Other Features
          </h3>

          <p>
            A tool for automating reasoning on variability models should be
            efficient, scalable and with enough expressivity to represent
            different kinds of variability constraints. These characteristics
            are evaluated on VariaMos as follows:
          </p>

          <p>
            <strong>
              <em>Reasoning efficiency.</em>
            </strong>{" "}
            The execution time of each reasoning operation can be calculated by
            the solver by means of a request for the current time (by means of
            the prolog function <pre className="d-inline">user_time(T1)</pre>)
            at the beginning and at the end (by means of the prolog function{" "}
            <pre className="d-inline">user_time(T2)</pre>) of each constraint
            program. The time spent by the solver to execute the operation at
            hand, is computed by means of the clause:{" "}
            <pre className="d-inline">T is T2 - T1</pre>. Works like the one
            presented by Mazo (2011) show the efficiency of VariaMos in
            verification of product line models and show the efficiency of
            VariaMos in transforming product line models.
          </p>

          <p>
            <strong>
              <em>Scalability.</em>
            </strong>{" "}
            VariaMos scalability has been validated using a corpus of 54 models
            specified in several languages, representing several domains and
            with sizes from 9 to 10000 variables as presented in (Mazo R.,
            Lopez-Herrejon R., Salinesi C., Diaz D., Egyed A. Conformance
            Checking with Constraint Logic Programming: The Case of Feature
            Models. In 35th Annual International Computer Software and
            Applications Conference (COMPSAC), IEEE Press, Munich-Germany,
            18-22, 2011). In all these cases, VariaMos shows a promising
            scalability in the execution of the reasoning operation presented in
            Section 3 and detailed in (Mazo, 2011) and (Mazo et al., 2012).
          </p>

          <p>
            <strong>
              <em>Expressivity.</em>
            </strong>{" "}
            In VariaMos, product line models can be loaded as XMI or text files
            and then, labeled with it particular notation. VariaMos offers
            several capabilities to represent and transform different types of
            product line models into constraint programs. In addition, models
            can be edited with XML and text editors furnished by Eclipse IDE.
            The power of expression of VariaMos is compared with the one of
            constraint (logic) programming to specify product line models as
            presented by Mazo (2011), Mazo et al. (2011) and Mazo et al. (2012).
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
            The fourth is the current version of VariaMos, which is now a
            microservices-based Web application. This new version has been
            entirely rewritten in Typescript and utilizes React for the user
            interface and a proprietary library (replacing MxGraph) for handling
            the diagrams. The process of creating new engineering languages has
            been reworked, removing the need to directly write code for the
            underlying and proprietary library in which the models of each
            language are represented; instead, user-defined specifications
            written as JSON files coupled to purpose-built graphical interfaces
            are used to provide all the support needed to define modeling
            languages and to create models with these languages. The JSON-based
            mechanisms for language creation now support the definition of the
            syntax (abstract and concrete), the semantics (for different
            reasoning paradigms and languages), and the specification of
            reasoning tasks for different modeling languages. Thanks to these
            capabilities, VariaMos manages the creation of projects at the two
            key levels of software product line engineering: domain engineering
            and application engineering.
          </p>

          <p>
            Compared to previous versions, in version 4.0 we have new
            capabilities such as the definition of the scope of each project and
            the creation of catalogs of potential products and derivatives of
            each product line. Additionally, in this new version of VariaMos, we
            added a new language-agnostic reasoning back-end that allows for a
            variety of reasoning queries to be performed. Among those reasoning
            operations that can be executed as queries (such as when
            manipulating a database with SQL), we can check our models for
            satisfiability and look for defects, configure products with and
            without partial configurations, perform simulations for dynamic
            software product line models, construct and find solutions to
            optimization problems based on the models, evolve our product lines,
            check the consistency of each evolution change, and much more. All
            of these tasks are user-specified and can be customized and tailored
            to support specific reasoning tasks needed for a given model type.
          </p>

          <p>
            In addition, language developers can consult and inspect the logical
            representation of the models of a given language as they construct
            it, further aiding them in the definition of the semantics.
          </p>

          <p>
            And for all those who want to contribute to this great project, you
            may be interested to know, not only that we are a proactive team in
            which we enjoy making this project grow, each one contributing what
            he/she knows best and can give (for example, the cloud
            infrastructure of this project is fully funded by Luis Fernando
            Londoño, the DevOps processes are managed by Jairo Soto, the
            application administration is ensured by Luis Giraldo, just to
            mention a few roles), but also that the tool is easily extensible by
            means of micro-services that can come to be coupled to the core of
            VariaMos. The VariaMos Framework is therefore dynamically extendable
            to new modeling languages, interdependencies among the languages,
            operations over the instances of the languages, and solvers to
            execute these operations, which greatly increases its usefulness in
            both teaching and industrial use cases.
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
            Orrego, Julian Carvajal, Julian Murillo, Luis Fernando Londoño, Luis
            Giraldo, Mauricio Agudelo, Oscar Aguayo, Paola Vallejo, Sam
            Nzongani, Raúl Mazo, Viviana Cobaleda, Williams Hoarau.
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
