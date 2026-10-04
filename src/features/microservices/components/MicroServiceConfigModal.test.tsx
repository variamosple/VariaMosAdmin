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

    const addBtn = screen.getByRole("button", { name: /Add Parameter/i });
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

  it("masks secret configurations and reveals them when eye button is toggled", async () => {
    const user = userEvent.setup();
    const configsWithSecret: MicroServiceConfigItem[] = [
      {
        id: 1,
        serviceName: "ms_admin",
        key: "DB_PASSWORD",
        value: "super_secret_pw",
        type: "string",
        isSecret: true,
        isReadOnly: false,
      },
    ];

    vi.mocked(
      MicroServiceRepository.getMicroServiceConfigurations,
    ).mockResolvedValue(
      new ResponseModel<MicroServiceConfigItem[]>().withData(configsWithSecret),
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

    // Verify secret is masked initially
    expect(screen.getByText("••••••••")).toBeInTheDocument();

    // Click toggle button via accessible title
    const eyeBtn = screen.getByTitle("Reveal value");
    await user.click(eyeBtn);
    expect(screen.getByText("super_secret_pw")).toBeInTheDocument();
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
