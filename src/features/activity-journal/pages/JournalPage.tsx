import { withPageVisit } from "@variamosple/variamos-components";
import type { FC } from "react";
import { Container, Tab, Tabs } from "react-bootstrap";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { AccessJournal } from "../components/AccessJournal";
import { ActivityJournal } from "../components/ActivityJournal";

/**
 * The activity and access journals, read-only (T-24 lot 3). Each tab reads
 * its journal when it is first opened.
 */
const JournalPageComponent: FC = () => {
  usePageTitle("Journal");
  return (
    <Container fluid="lg" className="my-2">
      <h1>Journal</h1>
      <hr />
      <Tabs defaultActiveKey="activity" className="mb-3" mountOnEnter>
        <Tab eventKey="activity" title="Activity">
          <ActivityJournal />
        </Tab>
        <Tab eventKey="access" title="Access">
          <AccessJournal />
        </Tab>
      </Tabs>
    </Container>
  );
};

export const JournalPage = withPageVisit(JournalPageComponent, "AdminJournal");
