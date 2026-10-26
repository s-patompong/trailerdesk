# Staff permissions

| Action                                       | Owner | Manager | Sales |
| -------------------------------------------- | ----- | ------- | ----- |
| View inventory and asking prices             | Yes   | Yes     | Yes   |
| Add/edit trailer details and prices          | Yes   | Yes     | No    |
| Update trailer status                        | Yes   | Yes     | Yes   |
| View dealer cost, margin and inventory value | Yes   | Yes     | No    |
| Delete records                               | Yes   | Yes     | No    |
| Manage leads, customers, quotes and deals    | Yes   | Yes     | Yes   |
| Place a customer hold                        | Yes   | Yes     | Yes   |
| Release/extend another person's hold         | Yes   | Yes     | No    |
| Invite, change roles and remove staff        | Yes   | Yes     | No    |
| Retry failed jobs                            | Yes   | Yes     | No    |
| Edit store settings/profile                  | Yes   | No      | No    |
| Billing                                      | Yes   | No      | No    |

Server source: `server/platform/permissions.ts`, `can` and `requirePermission`.
Organization membership operations also use Better Auth access control in `server/platform/auth.ts`.
Hiding a button is never permission enforcement. Every service must check permissions.

Delete and billing rows describe reserved policy permissions. This build does not
expose a general record-deletion or billing workflow; see the Phase 1 report.
