import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { AppConfig } from "@/shared/infrastructure/AppConfig";
import { server } from "@/shared/tests/mocks/server";
import type { NewConfiguration } from "../api/ConfigurationRepository";
import { NewConfigurationModal } from "./NewConfigurationModal";

const CREATE_URL = `${(AppConfig.ADMIN_API_URL || "").replace(/\/$/, "")}/v1/configurations`;

// The server answers with what it stored, or with its refusal
const serverAnswers = (refusal?: { status: number; message: string }) => {
  const bodies: NewConfiguration[] = [];
  server.use(
    http.post(CREATE_URL, async ({ request }) => {
      const body = (await request.json()) as NewConfiguration;
      bodies.push(body);
      return refusal
        ? HttpResponse.json(
            { errorCode: "DUPLICATE_ENTITY", message: refusal.message },
            { status: refusal.status },
          )
        : HttpResponse.json(
            {
              data: {
                ...body,
                requiresMfa: false,
                environmentScope: "all",
                isReadOnly: false,
                targetServices: ["variamos_ms_admin"],
              },
            },
            { status: 201 },
          );
    }),
  );
  return bodies;
};

const renderModal = () => {
  const onCreated = vi.fn();
  const onClose = vi.fn();
  render(
    <NewConfigurationModal show onClose={onClose} onCreated={onCreated} />,
  );
  return { user: userEvent.setup(), onCreated, onClose };
};

describe("NewConfigurationModal (EV-18 lot C.3)", () => {
  it("sends the key, the typed value and the tab, then closes", async () => {
    const bodies = serverAnswers();
    const { user, onCreated, onClose } = renderModal();

    await user.type(screen.getByLabelText("Key"), " general.max_items ");
    await user.selectOptions(screen.getByLabelText("Type"), "number");
    await user.type(screen.getByLabelText("Value"), "25");
    await user.type(screen.getByLabelText("Description"), "Items per page");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await vi.waitFor(() =>
      expect(onCreated).toHaveBeenCalledWith(
        expect.objectContaining({ key: "general.max_items", value: 25 }),
      ),
    );
    expect(bodies).toEqual([
      {
        key: "general.max_items",
        value: 25,
        type: "number",
        category: "general",
        isSecret: false,
        description: "Items per page",
      },
    ]);
    expect(onClose).toHaveBeenCalledWith();
  });

  it("sends a list typed as JSON, under the chosen tab, as a secret", async () => {
    const bodies = serverAnswers();
    const { user } = renderModal();

    await user.type(screen.getByLabelText("Key"), "security.allowed_hosts");
    await user.selectOptions(screen.getByLabelText("Type"), "array");
    await user.selectOptions(screen.getByLabelText("Category"), "security");
    await user.click(screen.getByLabelText(/Secret/));
    await user.click(screen.getByLabelText("Value"));
    await user.paste('["a.example", "b.example"]');
    await user.click(screen.getByRole("button", { name: "Create" }));

    await vi.waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toMatchObject({
      value: ["a.example", "b.example"],
      category: "security",
      isSecret: true,
    });
    expect(bodies[0]).not.toHaveProperty("description");
  });

  it.each([
    ["no dots", "The key is dot-separated lowercase words"],
    // An empty number field would otherwise read as 0
    ["general.limit", "Enter a number."],
  ])(
    "refuses the key %s with an empty number before sending",
    async (key, message) => {
      const bodies = serverAnswers();
      const { user } = renderModal();

      await user.type(screen.getByLabelText("Key"), key);
      await user.selectOptions(screen.getByLabelText("Type"), "number");
      await user.click(screen.getByRole("button", { name: "Create" }));

      expect(await screen.findByText(new RegExp(message))).toBeInTheDocument();
      expect(bodies).toHaveLength(0);
    },
  );

  it("refuses JSON it cannot read", async () => {
    serverAnswers();
    const { user } = renderModal();

    await user.type(screen.getByLabelText("Key"), "general.options");
    await user.selectOptions(screen.getByLabelText("Type"), "object");
    await user.click(screen.getByLabelText("Value"));
    await user.paste("{ not json");
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(
      await screen.findByText("The value is not valid JSON."),
    ).toBeInTheDocument();
  });

  it("shows the server's refusal and stays open", async () => {
    serverAnswers({
      status: 409,
      message: "Configuration with key 'general.motd' already exists.",
    });
    const { user, onCreated, onClose } = renderModal();

    await user.type(screen.getByLabelText("Key"), "general.motd");
    await user.type(screen.getByLabelText("Value"), "Hello");
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(
      await screen.findByText(
        "Configuration with key 'general.motd' already exists.",
      ),
    ).toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("forgets the draft when cancelled", async () => {
    const { user, onClose } = renderModal();

    await user.type(screen.getByLabelText("Key"), "general.motd");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledWith();
    expect(screen.getByLabelText("Key")).toHaveValue("");
  });
});
