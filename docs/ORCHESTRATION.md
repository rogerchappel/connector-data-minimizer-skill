# Orchestration

Use this tool between action planning and approval request generation.

1. Planner creates a connector action fixture.
2. This skill audits the requested fields against task and policy needs.
3. The agent revises the fixture or records a human-review rationale.
4. A separate approval workflow decides whether the external action may run.

The tool is safe for CI because it performs no network calls and reads only the
fixture paths supplied by the caller.

