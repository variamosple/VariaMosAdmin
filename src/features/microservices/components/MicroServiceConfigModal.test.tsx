import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResponseModel } from "@variamosple/variamos-components";
import { describe, expect, it, vi } from "vitest";
import * as MicroServiceRepository from "../api/MicroServiceRepository";
import type {
  MicroServiceAuditEntry,
  MicroServiceConfigItem,
} from "../domain/Entity/MicroService";
import { MicroServiceConfigModal } from "./MicroServiceConfigModal";

vi.mock("../api/MicroServiceRepository", () => ({
  getMicroServiceConfigurations: vi.fn(),
  getMicroServiceAuditLogs: vi.fn(),
  updateMicroServiceConfiguration: vi.fn(),
}));

describe("MicroServiceConfigModal - Behavior & Anti-Fragile Tests", () => {
  const defaultConfigs: MicroServiceConfigItem[] = [
    {
      id: 1,
      serviceName: "ms_admin",
      key: "MAX_CONNECTIONS",
      value: "100",
      type: "number",
      isSecret: false,
      isReadOnly: false,
    },
    {
      id: 2,
      serviceName: "ms_admin",
      key: "API_SECRET_KEY",
      value: "super_secret_token",
      type: "string",
      isSecret: false,
      isReadOnly: false,
    },
  ];

  const defaultAuditLogs: MicroServiceAuditEntry[] = [
    {
      id: 1,
      serviceName: "ms_admin",
      performedBy: "admin-1",
      actionType: "UPDATE_CONFIG",
      details: { key: "MAX_CONNECTIONS", newValue: "100" },
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(
      MicroServiceRepository.getMicroServiceConfigurations,
    ).mockResolvedValue(
      new ResponseModel<MicroServiceConfigItem[]>().withData(defaultConfigs),
    );
    vi.mocked(
      MicroServiceRepository.getMicroServiceAuditLogs,
    ).mockResolvedValue(
      new ResponseModel<MicroServiceAuditEntry[]>().withData(defaultAuditLogs),
    );
  });

  it("renders modal header with service display name and loads configuration list", async () => {
    render(
      <MicroServiceConfigModal
        show={true}
        serviceName="ms_admin"
        displayName="Administration Service"
        onHide={vi.fn()}
      />,
    );

    expect(screen.getByText(/Settings & Audit -/i)).toBeInTheDocument();
    expect(screen.getByText("Administration Service")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("MAX_CONNECTIONS")).toBeInTheDocument();
    });
  });

  it("allows toggling the add parameter form and creating a new configuration item", async () => {
    const user = userEvent.setup();
    const createdConfig: MicroServiceConfigItem = {
      id: 3,
      serviceName: "ms_admin",
      key: "LOG_LEVEL",
      value: "debug",
      type: "string",
      isSecret: false,
      isReadOnly: false,
    };

    vi.mocked(
      MicroServiceRepository.updateMicroServiceConfiguration,
    ).mockResolvedValue(
      new ResponseModel<MicroServiceConfigItem>().withData(createdConfig),
    );

    render(
      <MicroServiceConfigModal
        show={true}
        serviceName="ms_admin"
        displayName="Administration Service"
        onHide={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("MAX_CONNECTIONS")).toBeInTheDocument();
    });

    const addBtn = screen.getByRole("button", { name: /Add parameter/i });
    await user.click(addBtn);

    const keyInput = screen.getByPlaceholderText(/KEY_NAME/i);
    const valInput = screen.getByPlaceholderText(/Value/i);

    await user.type(keyInput, "LOG_LEVEL");
    await user.type(valInput, "debug");

    const saveBtn = screen.getByRole("button", { name: /Save/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(
        MicroServiceRepository.updateMicroServiceConfiguration,
      ).toHaveBeenCalledWith("ms_admin", "LOG_LEVEL", "debug");
    });
  });

  it("switches to audit trail tab and displays audit history", async () => {
    const user = userEvent.setup();
    render(
      <MicroServiceConfigModal
        show={true}
        serviceName="ms_admin"
        displayName="Administration Service"
        onHide={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("MAX_CONNECTIONS")).toBeInTheDocument();
    });

    const auditTab = screen.getByRole("tab", { name: /Audit Trail/i });
    await user.click(auditTab);

    await waitFor(() => {
      expect(screen.getByText("UPDATE_CONFIG")).toBeInTheDocument();
    });
  });

  describe("secret parameters", () => {
    const secretConfigs: MicroServiceConfigItem[] = [
      {
        id: 1,
        serviceName: "ms_admin",
        key: "DB_PASSWORD",
        // The API sends the mask; a raw value here proves it is never shown
        value: "super_secret_pw",
        type: "string",
        isSecret: true,
        isReadOnly: false,
      },
    ];

    const renderWithSecret = async () => {
      vi.mocked(
        MicroServiceRepository.getMicroServiceConfigurations,
      ).mockResolvedValue(
        new ResponseModel<MicroServiceConfigItem[]>().withData(secretConfigs),
      );
      render(
        <MicroServiceConfigModal
          show={true}
          serviceName="ms_admin"
          displayName="Administration Service"
          onHide={vi.fn()}
        />,
      );
      await waitFor(() => {
        expect(screen.getByText("DB_PASSWORD")).toBeInTheDocument();
      });
    };

    it("shows only the mask and offers no way to reveal the value", async () => {
      await renderWithSecret();

      expect(screen.getByText("********")).toBeInTheDocument();
      expect(screen.queryByText("super_secret_pw")).not.toBeInTheDocument();
      expect(screen.queryByTitle("Reveal value")).not.toBeInTheDocument();
    });

    it("replaces a secret from an empty password field", async () => {
      const user = userEvent.setup();
      vi.mocked(
        MicroServiceRepository.updateMicroServiceConfiguration,
      ).mockResolvedValue(
        new ResponseModel<MicroServiceConfigItem>().withData({
          ...secretConfigs[0],
          value: "********",
        } as MicroServiceConfigItem),
      );
      await renderWithSecret();

      await user.click(screen.getByTitle("Edit parameter"));
      const input = screen.getByLabelText("New value for DB_PASSWORD");
      expect(input).toHaveValue("");
      expect(input).toHaveAttribute("type", "password");
      const saveButton = screen.getByRole("button", {
        name: /Save DB_PASSWORD/i,
      });
      expect(saveButton).toBeDisabled();

      await user.type(input, "new_pw");
      await user.click(saveButton);

      await waitFor(() => {
        expect(
          MicroServiceRepository.updateMicroServiceConfiguration,
        ).toHaveBeenCalledWith("ms_admin", "DB_PASSWORD", "new_pw");
      });
    });

    it("shows the reason when the API refuses the update", async () => {
      const user = userEvent.setup();
      vi.mocked(
        MicroServiceRepository.updateMicroServiceConfiguration,
      ).mockResolvedValue(
        new ResponseModel<MicroServiceConfigItem>().withError(
          403,
          "Updating configuration 'DB_PASSWORD' requires MFA validation: use the configuration page.",
        ),
      );
      await renderWithSecret();

      await user.click(screen.getByTitle("Edit parameter"));
      await user.type(
        screen.getByLabelText("New value for DB_PASSWORD"),
        "new_pw",
      );
      await user.click(
        screen.getByRole("button", { name: /Save DB_PASSWORD/i }),
      );

      expect(
        await screen.findByText(/requires MFA validation/),
      ).toBeInTheDocument();
    });
  });

  it("prevents editing read-only configuration parameters", async () => {
    const readOnlyConfigs: MicroServiceConfigItem[] = [
      {
        id: 10,
        serviceName: "ms_admin",
        key: "SYSTEM_VERSION",
        value: "2.4.0",
        type: "string",
        isSecret: false,
        isReadOnly: true,
      },
    ];

    vi.mocked(
      MicroServiceRepository.getMicroServiceConfigurations,
    ).mockResolvedValue(
      new ResponseModel<MicroServiceConfigItem[]>().withData(readOnlyConfigs),
    );

    render(
      <MicroServiceConfigModal
        show={true}
        serviceName="ms_admin"
        displayName="Administration Service"
        onHide={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("SYSTEM_VERSION")).toBeInTheDocument();
    });

    expect(screen.getByText("Read-only")).toBeInTheDocument();
    expect(screen.queryByTitle("Edit parameter")).not.toBeInTheDocument();
  });

  it("supports inline editing of editable parameters", async () => {
    const user = userEvent.setup();
    const updatedConfig: MicroServiceConfigItem = {
      id: 1,
      serviceName: "ms_admin",
      key: "MAX_CONNECTIONS",
      value: "250",
      type: "number",
      isSecret: false,
      isReadOnly: false,
    };

    vi.mocked(
      MicroServiceRepository.updateMicroServiceConfiguration,
    ).mockResolvedValue(
      new ResponseModel<MicroServiceConfigItem>().withData(updatedConfig),
    );

    render(
      <MicroServiceConfigModal
        show={true}
        serviceName="ms_admin"
        displayName="Administration Service"
        onHide={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("MAX_CONNECTIONS")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle("Edit parameter");
    await user.click(editButtons[0]);

    const inlineInput = screen.getByDisplayValue("100");
    await user.clear(inlineInput);
    await user.type(inlineInput, "250");

    const saveCheckBtn = screen.getByRole("button", {
      name: /Save MAX_CONNECTIONS/i,
    });
    await user.click(saveCheckBtn);

    await waitFor(() => {
      expect(
        MicroServiceRepository.updateMicroServiceConfiguration,
      ).toHaveBeenCalledWith("ms_admin", "MAX_CONNECTIONS", "250");
    });
  });

  it("resiliently recovers when update API call rejects without breaking the UI", async () => {
    const user = userEvent.setup();
    vi.mocked(
      MicroServiceRepository.updateMicroServiceConfiguration,
    ).mockRejectedValue(new Error("Network timeout"));

    render(
      <MicroServiceConfigModal
        show={true}
        serviceName="ms_admin"
        displayName="Administration Service"
        onHide={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("MAX_CONNECTIONS")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle("Edit parameter");
    await user.click(editButtons[0]);

    const inlineInput = screen.getByDisplayValue("100");
    await user.clear(inlineInput);
    await user.type(inlineInput, "500");

    const saveCheckBtn = screen.getByRole("button", {
      name: /Save MAX_CONNECTIONS/i,
    });
    // Should not throw or crash component
    await user.click(saveCheckBtn);

    // Modal remains fully functional and accessible
    await waitFor(() => {
      expect(screen.getByText("MAX_CONNECTIONS")).toBeInTheDocument();
    });
  });

  it("displays empty state placeholder when no configurations exist", async () => {
    vi.mocked(
      MicroServiceRepository.getMicroServiceConfigurations,
    ).mockResolvedValue(
      new ResponseModel<MicroServiceConfigItem[]>().withData([]),
    );

    render(
      <MicroServiceConfigModal
        show={true}
        serviceName="ms_admin"
        displayName="Administration Service"
        onHide={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/No custom configuration parameters found/i),
      ).toBeInTheDocument();
    });
  });

  it("triggers onHide when close button is clicked", async () => {
    const user = userEvent.setup();
    const onHideMock = vi.fn();

    render(
      <MicroServiceConfigModal
        show={true}
        serviceName="ms_admin"
        displayName="Administration Service"
        onHide={onHideMock}
      />,
    );

    const closeButtons = screen.getAllByRole("button", { name: /Close/i });
    await user.click(closeButtons[0]);

    expect(onHideMock).toHaveBeenCalled();
  });
});
