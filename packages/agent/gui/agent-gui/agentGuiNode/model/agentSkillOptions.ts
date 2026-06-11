import type { AgentGUIProviderSkillOption } from "./agentGuiNodeTypes";

export interface SkillTriggerQueryMatch {
  end: number;
  query: string;
  prefix: "$" | "/";
  start: number;
}

export function getProviderSkillQueryMatch(input: {
  draft: string;
  provider: string;
}): SkillTriggerQueryMatch | null {
  const match = /(^|[ \n\t])([$/])([^\s]*)$/.exec(input.draft);
  if (!match) {
    return null;
  }
  const separator = match[1] ?? "";
  return {
    end: input.draft.length,
    query: match[3] ?? "",
    prefix: match[2] === "$" ? "$" : "/",
    start: match.index + separator.length
  };
}

export function filterProviderSkills(input: {
  skills: readonly AgentGUIProviderSkillOption[];
  query: string;
  triggerPrefix: "$" | "/";
}): AgentGUIProviderSkillOption[] {
  const normalizedQuery = input.query.trim().toLowerCase();
  return input.skills.filter((skill) => {
    const trigger = skillTriggerForPrefix(skill, input.triggerPrefix);
    if (!normalizedQuery) {
      return true;
    }
    const name = skill.name.trim().toLowerCase();
    const normalizedTrigger = trigger.trim().toLowerCase();
    const description = skill.description?.trim().toLowerCase() ?? "";
    return (
      name.startsWith(normalizedQuery) ||
      normalizedTrigger.slice(1).startsWith(normalizedQuery) ||
      description.includes(normalizedQuery)
    );
  });
}

export function draftForProviderSkill(
  skill: AgentGUIProviderSkillOption,
  currentDraft = "",
  match: SkillTriggerQueryMatch | null = getProviderSkillQueryMatch({
    draft: currentDraft,
    provider: skill.trigger.startsWith("$") ? "codex" : ""
  })
): string {
  const trigger = skillTriggerForPrefix(skill, match?.prefix);
  if (!trigger) {
    return currentDraft;
  }
  if (!match) {
    return `${trigger} `;
  }
  return `${currentDraft.slice(0, match.start)}${trigger} ${currentDraft.slice(match.end)}`;
}

export function skillTriggerForPrefix(
  skill: AgentGUIProviderSkillOption,
  prefix: "$" | "/" | undefined
): string {
  const trigger = skill.trigger.trim();
  if (!trigger) {
    return "";
  }
  if (prefix === undefined || trigger.startsWith(prefix)) {
    return trigger;
  }
  if (trigger.startsWith("$") || trigger.startsWith("/")) {
    return `${prefix}${trigger.slice(1)}`;
  }
  return `${prefix}${trigger}`;
}

export function labelForProviderSkill(
  skill: AgentGUIProviderSkillOption,
  prefix: "$" | "/" | undefined
): string {
  return stripSkillTriggerPrefix(skillTriggerForPrefix(skill, prefix));
}

export function promptForProviderSkills(input: {
  prompt: string;
  provider: string;
  skills: readonly AgentGUIProviderSkillOption[];
}): string {
  const nativePrefix = input.provider.trim() === "codex" ? "$" : "/";
  let prompt = input.prompt;
  for (const skill of input.skills) {
    const nativeTrigger = skillTriggerForPrefix(skill, nativePrefix);
    const aliasPrefix = nativePrefix === "$" ? "/" : "$";
    const aliasTrigger = skillTriggerForPrefix(skill, aliasPrefix);
    if (!nativeTrigger || !aliasTrigger || nativeTrigger === aliasTrigger) {
      continue;
    }
    prompt = replaceSkillTriggerToken(prompt, aliasTrigger, nativeTrigger);
  }
  return prompt;
}

export function skillDescriptionForDisplay(
  description: string | undefined
): string | undefined {
  const line = description
    ?.split(/\r?\n/)
    .map((part) => part.trim())
    .find((part) => part !== "");
  return line || undefined;
}

function replaceSkillTriggerToken(
  prompt: string,
  from: string,
  to: string
): string {
  return prompt.replace(
    new RegExp(`(^|\\s)${escapeRegExp(from)}(?=$|\\s)`, "g"),
    (_match, separator: string) => `${separator}${to}`
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripSkillTriggerPrefix(trigger: string): string {
  if (trigger.startsWith("$") || trigger.startsWith("/")) {
    return trigger.slice(1);
  }
  return trigger;
}
