import { registerAgentCustomMentionKind } from "@tutti-os/agent-gui";

// desktop 宿主注册的自定义 mention kind(agent-gui 包只提供通用管线,业务 kind 由宿主注册)。
//
// room-message:tsh 群聊「发送给 Agent」的消息引用(协议契约见 tsh 仓
// openspecs/proposals/room-message-mention-contract.md)。composer 内渲染成通用双行卡
// (第一行 label=发送者+条数,第二行首条消息摘录),点击经 open-custom-mention 上抛,
// runDesktopAgentGUILinkAction 打开群聊应用并定位首条消息。
export function registerDesktopCustomMentionKinds(): void {
  registerAgentCustomMentionKind({
    kind: "room-message",
    clickable: true,
    present: (mention) => {
      const roomId = mention.scope?.roomId?.trim() ?? "";
      if (!roomId || !mention.entityId.trim()) {
        return null;
      }
      return {
        name: mention.label,
        summary: mention.scope?.preview?.trim() || undefined,
        workspaceId: roomId
      };
    }
  });
}
