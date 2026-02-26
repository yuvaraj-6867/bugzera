/**
 * Role-based permissions hook — BugZera SRS Section
 *
 * #   Tab              Member          Manager          Admin   Developer       Viewer
 * ─────────────────────────────────────────────────────────────────────────────────────
 *  1  Dashboard        View            View+Config      Full    View            View
 *  2  Projects         View            Create/Edit      Full    View            View
 *  3  Test Cases       Create/Edit/Exec Full            Full    View            View
 *  4  Test Plans       View            Create/Edit      Full    View            View
 *  5  Test Runs        Execute/View    Full             Full    View            View
 *  6  Tickets          Create/Edit     Full             Full    Edit(assigned)  View
 *  7  Sprints          View            Create/Edit      Full    View            View
 *  8  Documents        View            Create/Edit/Del  Full    View            View
 *  9 Calendar         View/Add        Full             Full    View            View
 * 10  Activity         View            View             Full    View            View
 * 11  Users            View team       Invite/Manage    Full    View team       View team
 * 12  Analytics        Basic           Full             Full    Basic           Basic
 * 13  Settings         View            Edit project     Full    ❌              ❌
 * 14  Integrations     ❌              Configure        Full    ❌              ❌
 * 15  Knowledge Base   ❌              View/Edit        Full    ❌              ❌
 * 16  Environments     ❌              Configure        Full    ❌              ❌
 * 17  Test Data        ❌              Manage           Full    ❌              ❌
 * 18  Automation       ❌              ❌               Full    ❌              ❌
 */

export type UserRole = 'admin' | 'manager' | 'member' | 'developer' | 'viewer'

export function usePermissions() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const role: UserRole = user.role || 'member'

  const isAdmin     = role === 'admin'
  const isManager   = role === 'manager'
  const isMember    = role === 'member'
  const isDeveloper = role === 'developer'
  const isViewer    = role === 'viewer'

  const isAdminOrManager       = isAdmin || isManager
  const isAdminManagerOrMember = isAdmin || isManager || isMember

  return {
    role,
    isAdmin,
    isManager,
    isMember,
    isDeveloper,
    isViewer,
    isReadOnly:      isViewer,
    isAdminOrManager,

    // ── canView: can this role open / see the tab at all? ───────────────────
    canView: {
      dashboard:     true,                       //  1. All roles
      projects:      true,                       //  2. All roles
      projectDetails:true,                       //  3. All roles
      testCases:     true,                       //  4. All roles (Member:Create/Edit | Dev/Viewer:View)
      testPlans:     true,                       //  5. All roles (Manager/Admin:Create/Edit | others:View)
      testRuns:      true,                       //  6. All roles (Member:Execute | Dev/Viewer:View)
      tickets:       true,                       //  7. All roles (Member:Create/Edit | Dev:Edit-assigned | Viewer:View)
      sprints:       true,                       //  8. All roles (Manager/Admin:Create/Edit | others:View)
      documents:     true,                       //  9. All roles (Manager/Admin:Create/Edit/Delete | others:View)
      calendar:      true,                       // 10. All roles (Member:View/Add | Manager/Admin:Full | Dev/Viewer:View)
      activity:      true,                       // 11. All roles
      users:         true,                       // 12. All roles (Manager/Admin:Invite/Manage | others:View team)
      analytics:     true,                       // 13. All roles (Manager/Admin:Full | others:Basic)
      settings:      isAdminManagerOrMember,     // 14. Member:View | Manager:Edit | Admin:Full | Dev:❌ | Viewer:❌
      integrations:  isAdminOrManager,           // 15. Manager:Configure | Admin:Full | others:❌
      knowledgeBase: isAdminOrManager,           // 16. Manager:View/Edit | Admin:Full | others:❌
      environments:  isAdminOrManager,           // 17. Manager:Configure | Admin:Full | others:❌
      testData:      isAdminOrManager,           // 18. Manager:Manage | Admin:Full | others:❌
      automation:    isAdmin,                    // 19. Admin:Full | others:❌
    },

    // ── canCreate ────────────────────────────────────────────────────────────
    canCreate: {
      // Tab 2/3 — Projects: Manager Create | Admin Full | others View
      projects:      isAdminOrManager,
      // Tab 4 — Test Cases: Member Create/Edit/Exec | Manager+Admin Full | Dev/Viewer View
      testCases:     isAdminManagerOrMember,
      // Tab 5 — Test Plans: Manager Create/Edit | Admin Full | Member+Dev+Viewer View
      testPlans:     isAdminOrManager,
      // Tab 6 — Test Runs: Member Execute (=create run) | Manager+Admin Full | Dev/Viewer View
      testRuns:      isAdminManagerOrMember,
      // Tab 7 — Tickets: Member Create/Edit | Manager+Admin Full | Dev:Edit-assigned | Viewer View
      tickets:       isAdminManagerOrMember,
      // Tab 8 — Sprints: Manager Create/Edit | Admin Full | Member+Dev+Viewer View
      sprints:       isAdminOrManager,
      // Tab 9 — Documents: Manager Create/Edit/Delete | Admin Full | Member+Dev+Viewer View
      documents:     isAdminOrManager,
      // Tab 10 — Calendar: Member View/Add | Manager+Admin Full | Dev/Viewer View
      calendar:      isAdminManagerOrMember,
      // Tab 12 — Users: Admin Full only (Manager manages existing team, not create)
      users:         isAdmin,
      // Tab 17 — Environments: Manager Configure | Admin Full
      environments:  isAdminOrManager,
      // Tab 18 — Test Data: Manager Manage | Admin Full
      testData:      isAdminOrManager,
      // Tab 19 — Automation: Admin Full only
      automation:    isAdmin,
    },

    // ── canEdit ──────────────────────────────────────────────────────────────
    canEdit: {
      // Tab 1 — Dashboard: Manager Configure | Admin Full | Member+Dev+Viewer View only
      dashboard:     isAdminOrManager,
      // Tab 2/3 — Projects: Manager Edit | Admin Full | others View
      projects:      isAdminOrManager,
      // Tab 4 — Test Cases: Member Create/Edit/Exec | Manager+Admin Full | Dev/Viewer View
      testCases:     isAdminManagerOrMember,
      // Tab 5 — Test Plans: Manager Edit | Admin Full | others View
      testPlans:     isAdminOrManager,
      // Tab 6 — Test Runs: Member Execute | Manager+Admin Full | Dev/Viewer View
      testRuns:      isAdminManagerOrMember,
      // Tab 7 — Tickets: Member Edit | Manager+Admin Full | Dev:Edit-assigned | Viewer View
      tickets:       isAdminManagerOrMember || isDeveloper,
      // Tab 8 — Sprints: Manager Edit | Admin Full | others View
      sprints:       isAdminOrManager,
      // Tab 9 — Documents: Manager Edit | Admin Full | others View
      documents:     isAdminOrManager,
      // Tab 10 — Calendar: Manager+Admin Full | Member:Add only | Dev/Viewer View
      calendar:      isAdminOrManager,
      // Tab 12 — Users: Manager Invite/Manage | Admin Full | others View team
      users:         isAdminOrManager,
      // Tab 14 — Settings: Manager Edit project | Admin Full | Member View only
      settings:      isAdminOrManager,
      // Tab 15 — Integrations: Manager Configure | Admin Full
      integrations:  isAdminOrManager,
      // Tab 16 — Knowledge Base: Manager View/Edit | Admin Full
      knowledgeBase: isAdminOrManager,
      // Tab 17 — Environments: Manager Configure | Admin Full
      environments:  isAdminOrManager,
      // Tab 18 — Test Data: Manager Manage | Admin Full
      testData:      isAdminOrManager,
      // Tab 19 — Automation: Admin Full only
      automation:    isAdmin,
    },

    // ── canDelete ────────────────────────────────────────────────────────────
    canDelete: {
      projects:      isAdmin,            // Tab 2 — Admin Full only
      testCases:     isAdminOrManager,   // Tab 4 — Manager+Admin Full
      testPlans:     isAdminOrManager,   // Tab 5 — Manager+Admin Full
      testRuns:      isAdminOrManager,   // Tab 6 — Manager+Admin Full
      tickets:       isAdminOrManager,   // Tab 7 — Manager+Admin Full
      sprints:       isAdminOrManager,   // Tab 8 — Manager+Admin Full
      documents:     isAdminOrManager,   // Tab 9 — Manager Create/Edit/Delete | Admin Full
      calendar:      isAdminOrManager,   // Tab 10 — Manager+Admin Full
      users:         isAdmin,            // Tab 12 — Admin Full only
      environments:  isAdminOrManager,   // Tab 17 — Manager+Admin Full
      testData:      isAdminOrManager,   // Tab 18 — Manager+Admin Full
      automation:    isAdmin,            // Tab 19 — Admin Full only
    },

    // ── Feature-level flags ──────────────────────────────────────────────────
    canManageUsers:           isAdminOrManager,      // Tab 12: Manager Invite/Manage | Admin Full
    canViewAnalytics:         true,                  // Tab 13: All roles (basic or full)
    canScheduleAnalytics:     isAdminOrManager,      // Tab 13: Manager Schedule | Admin Full
    canConfigureIntegrations: isAdminOrManager,      // Tab 15: Manager Configure | Admin Full
    canViewSettings:          isAdminManagerOrMember,// Tab 14: Dev/Viewer no access
    canManageSettings:        isAdminOrManager,      // Tab 14: Member View only
    canConfigureDashboard:    isAdminOrManager,      // Tab  1: Manager Configure | Admin Full
    canExportData:            !isViewer,             // All except Viewer
  }
}
