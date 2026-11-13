import { act, renderHook, waitFor } from "@testing-library/react";
import { ResponseModel } from "@variamosple/variamos-components";
import type { DefaultValues } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { useFormModal } from "./useFormModal";

interface Item {
  name: string;
}

const fieldsOf = (item?: Item): DefaultValues<Item> => ({ ...item });

// The ResponseModel of the tests (setupTests.ts): withError sets the code
const succeeded = () => new ResponseModel<Item>("t");
const failed = () => new ResponseModel<Item>("t").withError(400, "Taken");

const render = (options: {
  submit: (fields: Item) => Promise<ResponseModel<Item>>;
  isLoading?: boolean;
  onClose?: () => void;
  defaultValue?: Item;
}) =>
  renderHook(() =>
    useFormModal<Item, Item>({
      defaultValue: options.defaultValue,
      toFields: fieldsOf,
      submit: options.submit,
      isLoading: options.isLoading ?? false,
      onClose: options.onClose ?? vi.fn(),
    }),
  );

describe("useFormModal", () => {
  it("fills the form with the edited item", async () => {
    const { result } = render({
      submit: vi.fn(),
      defaultValue: { name: "users::query" },
    });

    await waitFor(() =>
      expect(result.current.form.getValues("name")).toBe("users::query"),
    );
  });

  it("sends the fields, then drops the edits after a successful save", async () => {
    const submit = vi.fn().mockResolvedValue(succeeded());
    const { result } = render({ submit, defaultValue: { name: "a" } });
    await waitFor(() =>
      expect(result.current.form.getValues("name")).toBe("a"),
    );
    act(() => result.current.form.setValue("name", "b"));

    await act(() => result.current.onSubmit());

    expect(submit).toHaveBeenCalledWith({ name: "b" });
    await waitFor(() =>
      expect(result.current.form.getValues("name")).toBe("a"),
    );
  });

  it("keeps the fields when the save fails", async () => {
    const submit = vi.fn().mockResolvedValue(failed());
    const { result } = render({ submit, defaultValue: { name: "a" } });
    await waitFor(() =>
      expect(result.current.form.getValues("name")).toBe("a"),
    );
    act(() => result.current.form.setValue("name", "b"));

    await act(() => result.current.onSubmit());

    expect(submit).toHaveBeenCalledTimes(1);
    expect(result.current.form.getValues("name")).toBe("b");
  });

  it("sends nothing while a save is running", async () => {
    const submit = vi.fn();
    const { result } = render({ submit, isLoading: true });

    await act(() => result.current.onSubmit());

    expect(submit).not.toHaveBeenCalled();
  });

  it("closes and drops the edits", async () => {
    const onClose = vi.fn();
    const { result } = render({
      submit: vi.fn(),
      onClose,
      defaultValue: { name: "a" },
    });
    await waitFor(() =>
      expect(result.current.form.getValues("name")).toBe("a"),
    );

    act(() => result.current.form.setValue("name", "b"));

    act(() => result.current.onCloseModal());

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(result.current.form.getValues("name")).toBe("a");
  });
});
