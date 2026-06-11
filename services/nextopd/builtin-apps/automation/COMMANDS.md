# Automation CLI Commands

The automation app exposes commands under the `automation` scope.

## Commands

### `nextop automation list`

List automation definitions.

### `nextop automation get`

Get one automation definition by id or exact name.

Examples:

```sh
nextop automation get --automation-id aut_123
nextop automation get --name "Daily review"
```

### `nextop automation create`

Create an automation definition.

Examples:

```sh
nextop automation create --name "Daily review" --prompt "Review today's changes"
nextop automation create --name "Hourly triage" --prompt "Triage open issues" --schedule-type interval --interval-minutes 60
nextop automation create --name "Weekday report" --prompt "Write a status report" --schedule-type weekly --days-of-week 1,2,3,4,5 --time-of-day 09:00
```

Schedule arguments:

- `--schedule-type manual|interval|daily|weekly|cron`
- `--interval-minutes 60`
- `--time-of-day 09:00`
- `--days-of-week 1,2,3,4,5`
- `--cron "0 9 * * 1"`

Runner arguments:

- `--provider codex`
- `--model gpt-5`
- `--reasoning-effort high`
- `--permission-mode full-access`
- `--runner-args "--model gpt-5"`
- `--env KEY=value,OTHER=value`

### `nextop automation update`

Update one automation definition by id. Omitted fields keep their current values.

Examples:

```sh
nextop automation update --automation-id aut_123 --name "Daily repo review"
nextop automation update --automation-id aut_123 --enabled false
nextop automation update --automation-id aut_123 --schedule-type cron --cron "0 9 * * 1"
```

### `nextop automation delete`

Delete one automation definition and its run history by id.

Examples:

```sh
nextop automation delete --automation-id aut_123
```

### `nextop automation run`

Trigger one automation immediately by id or exact name.

Examples:

```sh
nextop automation run --automation-id aut_123
nextop automation run --name "Daily review"
```

### `nextop automation runs`

List recent automation runs, optionally filtered by automation id.

Examples:

```sh
nextop automation runs
nextop automation runs --automation-id aut_123 --limit 20
```

### `nextop automation complete-run`

Submit the final structured status for a running automation.

This command is intended for automation runner prompts. It updates only the
matching running run's task status. The user-facing result should still be sent
as the agent's normal final Markdown response.
