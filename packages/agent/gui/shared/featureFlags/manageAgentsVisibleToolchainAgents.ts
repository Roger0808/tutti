import type { AgentHostManagedToolchainAgent } from "../utils/managedToolchainAgents";

const HIDDEN_MANAGE_AGENTS_TOOLCHAIN_AGENT_IDS = new Set<string>(["gemini"]);

export function isToolchainAgentVisibleInManageAgents(
  agent: AgentHostManagedToolchainAgent
): boolean {
  return !HIDDEN_MANAGE_AGENTS_TOOLCHAIN_AGENT_IDS.has(agent.id);
}

export function filterToolchainAgentsForManageAgents(
  agents: readonly AgentHostManagedToolchainAgent[]
): AgentHostManagedToolchainAgent[] {
  return agents.filter(isToolchainAgentVisibleInManageAgents);
}
