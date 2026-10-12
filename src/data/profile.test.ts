import { describe, expect, it } from "vitest";
import { scholars, sectionIds } from "./profile";

describe("profile data", () => {
  it("lists the guided scholars with a known status", () => {
    expect(scholars.map((s) => s.name)).toEqual([
      "Mrs. Puspanjali J",
      "Mr. K Vijay Kumar",
      "Mrs. Sunitha",
      "Raja Rajeshwari",
    ]);
    expect(scholars.filter((s) => s.status === "Completed")).toHaveLength(1);
    expect(scholars.filter((s) => s.status === "Pursuing")).toHaveLength(3);
  });

  it("has a unique id per section", () => {
    expect(new Set(sectionIds).size).toBe(sectionIds.length);
    expect(sectionIds).toContain("guidance");
  });
});
