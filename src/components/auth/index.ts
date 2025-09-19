// Auth & User Components
export { AuthForm } from './AuthForm';
export { SocialLoginButtons } from './SocialLoginButtons';
export { PasswordStrengthMeter } from './PasswordStrengthMeter';
export { ForgotPasswordForm } from './ForgotPasswordForm';
export { ProfileForm } from './ProfileForm';
export { TradingViewUsernameField } from './TradingViewUsernameField';
export { UserAvatarMenu } from './UserAvatarMenu';
export {
  RoleBadge,
  getRoleHierarchy,
  hasRolePrivilege,
  getRoleColor,
} from './RoleBadge';
export { ProtectedRoute } from './ProtectedRoute';
export {
  RoleGuard,
  AdminOnly,
  ModeratorAndAbove,
  PremiumAndAbove,
} from './RoleGuard';

// Types
export type { UserRole } from './RoleBadge';
