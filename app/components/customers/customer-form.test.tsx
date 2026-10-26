import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it } from "vitest";

import { CustomerForm } from "./customer-form";

afterEach(cleanup);

describe("CustomerForm", () => {
  it("shows dealership-friendly validation before sending invalid data", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CustomerForm />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Email address"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Add customer" }));

    expect(await screen.findByText("Enter the customer name.")).toBeTruthy();
    expect(
      await screen.findByText("Enter a valid email address."),
    ).toBeTruthy();
    expect(
      screen.getByLabelText("Customer name").getAttribute("aria-invalid"),
    ).toBe("true");
    expect(
      screen.getByLabelText("Email address").getAttribute("aria-invalid"),
    ).toBe("true");
  });
});
