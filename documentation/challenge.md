**English** | [Italiano](challenge.it.md)

# Challenge: Space Mission Design Game

[Index](README.md) · [Features and setup](../README.md)

## Educational objective

Space mission design balances scientific goals, spacecraft, instruments, launcher, orbit, mass, power, cost, data, communications, and lifetime. Improving one parameter can worsen others: a more capable instrument may increase science value, consumption, mass, and data to transmit.

The challenge proposes an interactive game where individuals or groups define a mission, manage limited resources, simulate execution, and understand the outcome. Its educational value is making subsystem trade-offs concrete and allowing experimentation, failure, and redesign.

This is an adaptation of the brief previously stored in the repository, not a verification of official event updates. Consult the official challenge page's Resources section for external materials and updates.

## Expected journey

1. Define objectives and requirements before technical choices.
2. Design the spacecraft and scientific payload.
3. Select launcher, destination, and orbit.
4. Check mass, energy, budget, data, communications, and lifetime.
5. Simulate and assess outcome, efficiency, and scientific value.
6. Revise the design using the final report.

There should not be one perfect answer: different configurations can meet different goals. Feedback should explain the consequences of decisions.

## Design considerations

| Area | Challenge expectations |
| --- | --- |
| Experience | Clear UI, tutorials, progressive difficulty and scenarios |
| Requirements | Explicit goals and consistent realistic constraints |
| Satellite | Structure, power, batteries, communications, computer, attitude control, instruments |
| Payload | Mass, cost, power, generated data, scientific return |
| Orbits | Coverage, windows, contacts, and lifetime depend on orbit selection |
| Launch | Compatibility between mass, destination, and launcher capacity |
| Resources | Understandable indicators for mass, power, money, data, and time |
| Evaluation | Performance, efficiency, and decision quality, with explanations |
| Collaboration | Potential cooperation for up to four people with distinct roles |

Collaboration can divide science, spacecraft, communications, and resource responsibilities while retaining shared final decisions. This is an objective in the brief, not a promise of implemented multiplayer.

## Additional ideas in the brief

Multiple scenarios, unexpected events, simplified or realistic models, interactive views, dashboards, final reports, design comparisons, leaderboards, cooperation, team competition, sandbox, and post-mission analysis are possible extensions. Inclusion in the brief does not mean each feature is implemented.

## Mapping to the current project

| Topic | Repository status |
| --- | --- |
| Design and resources | Browser data, rules, satellite configuration, budgets |
| Visual experience | Campus, rooms, 3D editors, and 2D/SVG views |
| Progression | Requirements, reviews, tests, launch, reports |
| Tutorial and experimentation | Tutorial and sandbox modes |
| Detailed orbital analysis | Optional GMAT with local fallback |
| Identity | Click-only introduction, required username/password registration or login, PostgreSQL |
| Mission persistence | Browser-local saves, without cloud storage |
| Online cooperation and rankings | No multiplayer or leaderboard backend implemented |

[Entry and accounts](entry-flow.md). Accounts, GMAT simulation, and local saves are separate components. See [architecture](architecture.md), [database](authentication.md), and [GMAT](gmat-integration-report.md) for technical behavior.
