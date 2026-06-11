import { describe, expect, it } from "vitest";
import {
  draftForProviderSkill,
  filterProviderSkills,
  getProviderSkillQueryMatch,
  labelForProviderSkill,
  promptForProviderSkills,
  skillDescriptionForDisplay
} from "./agentSkillOptions";

describe("agentSkillOptions", () => {
  it("matches Codex skill triggers at prompt boundaries", () => {
    expect(
      getProviderSkillQueryMatch({ draft: "$ar", provider: "codex" })
    ).toEqual({
      end: 3,
      prefix: "$",
      query: "ar",
      start: 0
    });
    expect(
      getProviderSkillQueryMatch({
        draft: "please use $ar",
        provider: "codex"
      })
    ).toEqual({
      end: 14,
      prefix: "$",
      query: "ar",
      start: 11
    });
    expect(
      getProviderSkillQueryMatch({ draft: "please$ar", provider: "codex" })
    ).toBeNull();
    expect(
      getProviderSkillQueryMatch({
        draft: "please use /ar",
        provider: "codex"
      })
    ).toEqual({
      end: 14,
      prefix: "/",
      query: "ar",
      start: 11
    });
  });

  it("matches Claude Code skill aliases at prompt boundaries", () => {
    expect(
      getProviderSkillQueryMatch({
        draft: "/front",
        provider: "claude-code"
      })
    ).toEqual({
      end: 6,
      prefix: "/",
      query: "front",
      start: 0
    });
    expect(
      getProviderSkillQueryMatch({
        draft: "please use /front",
        provider: "claude-code"
      })
    ).toEqual({
      end: 17,
      prefix: "/",
      query: "front",
      start: 11
    });
    expect(
      getProviderSkillQueryMatch({
        draft: "please/front",
        provider: "claude-code"
      })
    ).toBeNull();
    expect(
      getProviderSkillQueryMatch({
        draft: "please use $front",
        provider: "claude-code"
      })
    ).toEqual({
      end: 17,
      prefix: "$",
      query: "front",
      start: 11
    });
  });

  it("replaces the active skill token in the draft", () => {
    const match = getProviderSkillQueryMatch({
      draft: "please use $ar",
      provider: "codex"
    });

    expect(
      draftForProviderSkill(
        {
          name: "architecture-review",
          trigger: "$architecture-review",
          sourceKind: "project"
        },
        "please use $ar",
        match
      )
    ).toBe("please use $architecture-review ");
  });

  it("uses the active prefix when inserting a provider skill", () => {
    const codexSlashMatch = getProviderSkillQueryMatch({
      draft: "/ar",
      provider: "codex"
    });
    expect(
      draftForProviderSkill(
        {
          name: "architecture-review",
          trigger: "$architecture-review",
          sourceKind: "project"
        },
        "/ar",
        codexSlashMatch
      )
    ).toBe("/architecture-review ");

    const claudeDollarMatch = getProviderSkillQueryMatch({
      draft: "$front",
      provider: "claude-code"
    });
    expect(
      draftForProviderSkill(
        {
          name: "frontend-design",
          trigger: "/product-design:frontend-design",
          sourceKind: "plugin"
        },
        "$front",
        claudeDollarMatch
      )
    ).toBe("$product-design:frontend-design ");
  });

  it("filters provider skills through slash and dollar aliases", () => {
    expect(
      filterProviderSkills({
        skills: [
          {
            name: "architecture-review",
            trigger: "$architecture-review",
            sourceKind: "project"
          }
        ],
        query: "arch",
        triggerPrefix: "/"
      }).map((skill) => skill.name)
    ).toEqual(["architecture-review"]);

    expect(
      filterProviderSkills({
        skills: [
          {
            name: "frontend-design",
            trigger: "/product-design:frontend-design",
            sourceKind: "plugin"
          }
        ],
        query: "product",
        triggerPrefix: "$"
      }).map((skill) => skill.name)
    ).toEqual(["frontend-design"]);
  });

  it("creates display labels without trigger prefixes", () => {
    expect(
      labelForProviderSkill(
        {
          name: "caveman",
          trigger: "$caveman",
          sourceKind: "personal"
        },
        "/"
      )
    ).toBe("caveman");
    expect(
      labelForProviderSkill(
        {
          name: "frontend-design",
          trigger: "/product-design:frontend-design",
          sourceKind: "plugin"
        },
        "$"
      )
    ).toBe("product-design:frontend-design");
  });

  it("normalizes known skill aliases before sending to the provider", () => {
    expect(
      promptForProviderSkills({
        provider: "codex",
        prompt: "/caveman keep /init",
        skills: [
          {
            name: "caveman",
            trigger: "$caveman",
            sourceKind: "personal"
          }
        ]
      })
    ).toBe("$caveman keep /init");

    expect(
      promptForProviderSkills({
        provider: "claude-code",
        prompt: "$product-design:frontend-design keep /init",
        skills: [
          {
            name: "frontend-design",
            trigger: "/product-design:frontend-design",
            sourceKind: "plugin",
            pluginName: "product-design"
          }
        ]
      })
    ).toBe("/product-design:frontend-design keep /init");
  });

  it("uses the first useful description line", () => {
    expect(skillDescriptionForDisplay("\n  Search docs  \nMore details")).toBe(
      "Search docs"
    );
  });
});
