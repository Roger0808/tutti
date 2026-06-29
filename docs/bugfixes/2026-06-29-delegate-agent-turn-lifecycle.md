# 2026-06-29 委托 Agent 后主会话误判为"停止"的根因分析

> Status: **analysis / proposed fix（尚未实施代码改动）**
>
> 本文记录"主 Agent 用后台 `Task`/`Agent` 工具委托子 Agent 后，主会话被误判为停止/已完成"的根因诊断与候选修复方案，供后续实现与评审参考。

## 问题描述（Bug）

1. 当主 Agent 委托一个 Agent 出去并"停止等待"之后，主 Agent 的会话状态会流转到"停止/已完成"，但被委托的 Agent 可能仍在运行。
2. 被委托 Agent 结束之后，会不会反过来通知主 Agent？

GUI 表现：工具调用卡片显示"委托 agent 已完成"，主会话回到空闲态，但实际子 Agent 仍可能在跑。

## 结论速览

- 截图里的"委托 agent"是 **Claude Code ACP 内置的 `Task`/`Agent` 工具**（不是 `tutti claude start` 这类独立会话）。`childSessionID` 仅从工具响应里取出**用于展示**，Tutti 对子 Agent 没有任何运行时建模。
- **根因**：Tutti 把一个 "turn" 严格绑定为一次 ACP `prompt` 调用。主 Agent 用后台 `Task` 工具把子 Agent 派出去后结束本轮（`stopReason=end_turn`），`prompt` 调用返回 → `finishTurn` → 会话状态从 `Working` 回落到 `Ready`（GUI 显示"已停止/空闲"）。但子 Agent 活在 `claude-agent-acp` 子进程内部，会比这次 `prompt` 调用活得更久，Tutti 这边却没有任何托管对象代表它。
- "委托 agent 已完成"这个标签是**工具调用本身的状态**（后台派发调用立即返回 completed），**不是子 Agent 真正跑完**。
- 第二问的答案是"**传输层能回传，但生命周期层不会真正通知/恢复主 Agent**"——详见下文。

## 证据链（file:line）

### 1. "委托 agent" = ACP 内置 Task/Agent 工具，childSessionID 仅用于展示

- `packages/agent/daemon/runtime/standard_acp_adapter.go:2865-2879`
  - 工具名为 `Agent`/`Task` 时，从 `toolResponse["agentId"]` 取出写入 `body["childSessionID"]`。这是**只写、单向**的，纯展示用。
- GUI 投影/展示：
  - `packages/agent/gui/shared/agentConversation/projection/agentTaskProjection.ts:54-59`（`delegateSessionId`）
  - `packages/agent/gui/shared/agentConversation/components/tool-renderers/AgentTaskContent.tsx`
  - 标签映射 `delegate_agent` → "委托 Agent"：`packages/agent/gui/shared/workspaceAgentToolCallLabels.ts:20,42,44`
- Tutti 的会话创建（`CreateSessionInput`/`RuntimeStartInput`）**没有任何 parentSessionId 字段**，`tutti claude/codex start` 也不接受父会话参数 → Tutti 层面根本不存在"父子会话"模型。子 Agent 完全活在 ACP 子进程内部。

### 2. 一个 turn == 一次 ACP prompt 调用，调用返回即结束本轮

- `packages/agent/daemon/runtime/standard_acp_adapter.go:788-967`
  - `Exec()` 阻塞在 `acpSession.client.Call(ctx, acpMethodPrompt, ...)`（857 行）。
  - 传入的消息回调**只在这次 Call 期间有效**（`emit != nil`）。
  - Call 返回时按 `stopReason` 收尾；默认 `end_turn` → `FinishCompleted` + `EventTurnCompleted`（状态 `SessionStatusReady`）（948-953 行）。
- `packages/agent/daemon/runtime/controller.go`
  - `Exec` → `beginTurn`（477）→ `go runExecTurn`（482）。
  - `runExecTurn` 跑完 `adapter.Exec()` 后调用 `finishTurn`（~593）。
  - `finishTurn`（645-657）从 `c.turns[key]` 删除该 turn，再 `reconcileSessionStatusLocked`（654）。
  - `reconcileSessionStatusLocked`（751-763）：只要 `c.turns[key]` 没有活跃 turn，就把 `Working` 回落为 `Ready`。
  - ⇒ 主 Agent 把子 Agent 派出去并结束发言后，本轮 `prompt` 返回 `end_turn`，状态必然回落到 `Ready`。这就是"流转到停止"的直接原因。

### 3. 后台子 Agent 的回传：传输层能收，生命周期层接不住

- 传输层**确实**有持久通道（不是只在 Call 期间监听）：
  - `packages/agent/daemon/runtime/acp_client.go` `readLoop`/`dispatchMessage`（~424-496）：无 id 的通知在没有活跃 Call 时落到**持久 handler** `c.handler`。
  - 持久 handler 在连接初始化时注册：`standard_acp_adapter.go:716-720` → `handleACPMessage(..., emit==nil)`。
  - out-of-turn 的 `session/update` → `handleACPMessage`（~1758-1858，`emit==nil` 分支 1801-1802）→ `emitSessionEvents`（1891-1902）→ controller 的 sink `applySessionEventsByAgentSessionID`。
- 但生命周期层**接不住**：
  - `controller.go:1605-1634` `applySessionEventsByAgentSessionID` 直接 `applySessionEvents` + `store` + `publish`，**完全不碰 `c.turns`**（不调用 `beginTurn`）。
  - 后果一：不会创建托管 turn → 没有 cancel func → **Stop/Cancel 无法作用于这段"复活"的活动**（与已知 stuck-spinner 现象同源）。
  - 后果二：状态是否回到 `Working` 完全取决于这股 out-of-turn 事件流里**是否带 `EventTurnStarted`**。`applySessionEvents`（441-443）用 `deriveSessionStatusFromEvents` 逐事件推导状态——若后台完成只回传工具/消息事件而没有 turn-started，状态推导返回空，会话**继续停留在 `Ready`/"已停止"**，GUI 不会重新变忙。
  - 后果三（最关键）：主 Agent 的**模型**是否真的会基于子 Agent 结果继续推理，取决于 `claude-agent-acp` 是否会在后台任务完成时**自动开新一轮**。而 **Tutti 只在用户 `SendInput` 时才发起 prompt 调用**（`Exec` → `beginTurn`）。Tutti 自己不会主动补一次 continuation prompt。所以如果 ACP 不自动续轮，主 Agent 在功能上**不会被"通知/唤醒"**——只会看到"委托 agent 已完成"然后会话闲置。

## 第二问的明确回答

"被委托 Agent 结束后会不会反过来通知主 Agent？"

- **传输/事件层**：能。late 的 `session/update` 通过持久 handler + eventSink 回到 Tutti，会被 `applySessionEventsByAgentSessionID` 应用并 publish 到 GUI。
- **会话生命周期层**：不会真正"通知/恢复"。这条 late 路径绕过了 `beginTurn`/`c.turns`：
  - 不创建托管 turn（Stop/Cancel 无效）；
  - 状态是否回到 Working 取决于 late 事件流是否含 `EventTurnStarted`，否则会话保持"已停止"；
  - 是否真正"唤醒主模型继续干活"取决于 ACP 是否自动续轮，Tutti 本身不补 prompt。
- 一句话：**当前架构下，委托是"发出即结束本轮"，主 Agent 的托管会话不会因为子 Agent 跑完而被可靠地恢复为运行态。**

## 待最终确认的一个外部行为（影响修复选型）

`claude-agent-acp` 子进程在后台 `Task` 完成后，是**在同一个 `prompt` 调用内续轮**（即 prompt 调用此时其实不该返回 end_turn），还是**返回 end_turn 后另起 out-of-turn 流 / 等待客户端再 prompt**？

验证方式：在 `standard_acp_adapter.go` 的 exec/handle 日志（已有大量 `slog.Info`，如 `agent_session.acp.exec.message`、`exec.call_completed`）下，跑一次"主 Agent 用后台 Task 委托子 Agent 后停下"的真实场景，观察：

- `prompt` 调用是否在子 Agent 仍在跑时就返回 `end_turn`；
- 子 Agent 完成时是否有 `emit==nil` 的 out-of-turn `session/update` 到达；
- 这些 late 事件里有没有 `EventTurnStarted`。

这决定修复落点：

- 若 ACP 会续轮但走 out-of-turn → 修复重点是"把 out-of-turn 续轮纳入托管 turn"。
- 若 ACP 不续轮 → 还需 Tutti 端在检测到后台委托未结束时，避免过早把会话判为终态，并提供恢复 / 续轮入口。

## 修复方案（待确认后实施）

### 方案 A（推荐，最小且对症）：识别"存在未完成的后台委托"，避免过早判终态 + 把 late 续轮托管化

1. 在 `standardACPUpdateEvents` / 工具调用归一化处标记后台委托：当 `Task`/`Agent` 工具以后台模式派发（工具调用 completed 但代表的是"已派发"而非"已完成"）时，记录该会话存在 pending delegate（计数 / 集合）。
2. turn 收尾时（`Exec` 的 `end_turn` 分支 / `finishTurn`）：若该会话仍有 pending delegate，**不要**把状态直接回落为 `Ready`，而是引入一个明确的中间态（如 `SessionStatusWaiting` 语义的"等待委托结果"），让 GUI 显示"等待委托 Agent"而非"已停止"。
3. 当后台委托完成的 out-of-turn 事件到达 `applySessionEventsByAgentSessionID` 时：若识别到对应的 delegate 完成，将其纳入一个**托管的轻量 turn**（注册到 `c.turns` 并带 cancel），使 Stop/Cancel 可用、状态正确回到 `Working` 再到 `Ready`，与正常 turn 行为一致。
4. pending delegate 清空且无活跃 turn 时，才允许回落到 `Ready`。

### 方案 B（更彻底）：为 out-of-turn 续轮建立"被动 turn"通用机制

- 在 controller 增加 `beginPassiveTurn` / 收尾逻辑：当 sink 收到带 `EventTurnStarted` 的 out-of-turn 事件且当前无活跃 turn 时，自动开一个托管 turn（带 cancel context），收到终态事件再 `finishTurn`。
- 这能同时修复本问题与"会话自发复活但 Tutti 接不住"一类问题，但改动面更大、需谨慎处理并发与去重。

### 测试

- 失败用例（先写）：模拟 adapter 在 `Exec` 返回 `end_turn` 后，通过 sink 投递一段代表"后台委托完成"的 out-of-turn 事件序列；断言：
  - 收尾后若存在 pending delegate，会话不是 `Ready` 而是"等待委托"中间态；
  - late 事件到达后会话经历 `Working` → `Ready` 且期间存在可被 Cancel 的托管 turn。
- 回归：普通（无委托）turn 行为不变；前台 / 阻塞式 Task（非后台）行为不变。

## 不在本次范围

- 跨独立 Tutti 会话（`tutti claude/codex start`）的父子链路与回调——当前完全不存在，属另一项更大的产品改动，不在本修复内。
