# Permission Model Validation Report

## 🚨 Critical Issues Found

### 1. **Role vs Permission Confusion**
- **Current**: System mixes `role` and `permission_level` with 'admin' as both a role and permission
- **Expected**: Admin should be an overlay permission, not a role replacement
- **Impact**: Violates "exactly one primary role" requirement

### 2. **Missing Permission Actions**
Current `check_user_permission` function only handles:
- `view_goals`, `create_goals`, `delete_goals`, `edit_goals`, `add_steps`, `mark_complete`, `edit_profile`, `manage_supporters`

**Missing from Expected Matrix:**
- ❌ `manage_rewards` (Reward Bank management)
- ❌ `invite_members` / `remove_members` 
- ❌ `change_roles` / `grant_admin`
- ❌ `adjust_privacy` / `adjust_sharing`
- ❌ `export_reports` (with scope: own/limited/full)
- ❌ `view_as_user` (impersonation with consent)

### 3. **Inconsistent Permission Logic**
```sql
-- Current problematic logic:
WHEN 'manage_supporters' THEN
  RETURN _permission_level = 'admin' AND _user_role = 'supporter';
```
This requires BOTH admin permission AND supporter role, which contradicts the matrix where Admin can manage supporters regardless of role.

### 4. **Missing Enforcement Mechanisms**

#### Edge Cases Not Handled:
- ❌ No "at least one Admin per circle" enforcement
- ❌ No user consent toggle for "view as" functionality  
- ❌ No special handling for Provider access to reflections
- ❌ No age-of-majority Admin rights transfer

#### Audit & Transparency:
- ❌ No logging of Admin actions (role changes, "view as", reward approvals)
- ❌ No user notifications when Admin acts on their behalf

### 5. **Database Schema Issues**
Current `supporters` table structure:
```sql
role: user_role           -- Includes 'admin' as a role (incorrect)
permission_level: permission_level  -- 'viewer'|'collaborator'|'admin'
is_provisioner: boolean   -- Separate flag (good)
```

**Problem**: Admin appears in both `role` and `permission_level` enums.

## 📋 Validation Against Expected Matrix

| Action | User | Supporter | Friend | Provider | Admin | Current Status |
|--------|------|-----------|--------|----------|-------|----------------|
| Create/edit goals | ✅ | Suggest | ❌ | Suggest | ✅ | ⚠️ **Partial** - "suggest" not implemented |
| Complete steps | ✅ | Cheer | Cheer | Cheer | ✅ | ⚠️ **Partial** - "cheer" vs actual completion unclear |
| Manage Reward Bank | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ **Missing** - action not defined |
| Invite/remove members | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ **Missing** - action not defined |
| Change roles/grant admin | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ **Missing** - action not defined |
| Adjust privacy/sharing | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ **Missing** - action not defined |
| Export reports | ✅(own) | ❌ | ❌ | ✅(limited) | ✅(full) | ❌ **Missing** - action not defined |
| View as another role | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ **Missing** - action not defined |

## 🔧 Required Fixes

### 1. **Restructure Permission Model**
```typescript
// Correct structure:
interface Supporter {
  role: 'supporter' | 'friend' | 'provider'  // Remove 'admin' from roles
  permission_level: 'viewer' | 'collaborator' 
  is_admin: boolean  // Admin as overlay permission
}
```

### 2. **Update Database Function**
Add missing permission actions:
- `manage_rewards`
- `invite_members`, `remove_members`
- `change_roles`, `grant_admin` 
- `adjust_privacy`, `adjust_sharing`
- `export_reports` (with scope parameter)
- `view_as_user` (with consent check)

### 3. **Implement Missing Safeguards**
- Circle must have at least one admin
- User consent required for "view as"
- Provider reflection access controls
- Admin action audit logging

### 4. **UI Permission Enforcement**
Current `PermissionGate` component exists but needs expansion to handle all new actions and proper UI feedback (disable vs hide).

## 🎯 Recommendations

1. **Immediate**: Fix role/permission confusion in database schema
2. **High Priority**: Implement missing permission actions 
3. **Medium Priority**: Add audit logging and safeguards
4. **Long Term**: Build age-of-majority transition flow

**Security Risk**: Current system has gaps that could allow unauthorized access to sensitive data or functions.