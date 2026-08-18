import {
  Events,
  Footer,
  Header,
  MenuContextProvider,
} from "@variamosple/variamos-components";
import { type FC, type ReactNode, useEffect, useState } from "react";
import {
  createBug,
  queryCategories,
} from "@/features/bug-tracker/api/BugRepository";
import { BugFormModal } from "@/features/bug-tracker/components/BugFormModal";
import type { Bug } from "@/features/bug-tracker/domain/Bug";
import { requestMenuConfig } from "@/shared/api/ConfigRepository";
import { AppConfig } from "@/shared/infrastructure/AppConfig";

export const MainLayout: FC<{ children?: ReactNode }> = ({ children }) => {
  const [showBugModal, setShowBugModal] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Listen to the navigation intercept event
    const handleOpenModal = () => {
      setShowBugModal(true);
    };
    Events.subscribe<Record<string, never>>(
      "openReportBugModal",
      handleOpenModal,
    );

    // Load bug categories on mount
    queryCategories().then((res) => {
      if (!res.errorCode && res.data) {
        setCategories(res.data);
      }
    });

    return () => {
      Events.unsubscribe<Record<string, never>>(
        "openReportBugModal",
        handleOpenModal,
      );
    };
  }, []);

  const handleCreateBugSubmit = async (data: Bug, file?: File) => {
    setIsSubmitting(true);
    const res = await createBug(
      data.title,
      data.description,
      data.priority || "medium",
      data.category,
      undefined, // githubRepo not needed for lambda users
      file,
    );
    setIsSubmitting(false);
    if (!res.errorCode) {
      setShowBugModal(false);
    } else {
      alert(res.message || "Failed to submit bug. Please try again.");
    }
  };

  return (
    <>
      <MenuContextProvider requestMenu={requestMenuConfig}>
        <Header
          logoUrl={"./images/VariaMosLogo.png"}
          logoAlt="VariaMos logo"
          signInUrl={AppConfig.LOGIN_URL}
        />
      </MenuContextProvider>

      {children}

      <BugFormModal
        mode="user"
        show={showBugModal}
        onHide={() => setShowBugModal(false)}
        onSubmit={handleCreateBugSubmit}
        repos={[]}
        categories={categories}
        isSubmitting={isSubmitting}
      />

      <Footer />
    </>
  );
};
