import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RouteLoadingScreen } from "./RouteLoadingScreen";
import { TableSkeleton } from "./skeletons";

describe("loading primitives", () => {
  it("holds the route with the AdVista mark", () => {
    render(<RouteLoadingScreen />);
    expect(screen.getByRole("status")).toHaveTextContent("Opening AdVista");
  });

  it("reserves one cell for every table column", () => {
    const { container } = render(<TableSkeleton rows={2} cols={10} />);
    expect(container.querySelectorAll("thead th")).toHaveLength(10);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(2);
  });
});
