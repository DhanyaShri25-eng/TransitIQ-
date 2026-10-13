/**
 * SmartPassFlow / TransitIQ Data Models & Constants
 */

export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  TRANSPORT_ADMIN: 'Transport Administrator',
  FEE_ADMIN: 'Fee Administrator',
  READ_ONLY: 'Read-Only Viewer',
};

export const VERIFICATION_STATUSES = {
  VALID: 'VALID',
  DUPLICATE: 'DUPLICATE',
  UNPAID: 'UNPAID',
  PASS_EXPIRED: 'PASS_EXPIRED',
  WRONG_BUS: 'WRONG_BUS',
  UNREGISTERED_CARD: 'UNREGISTERED_CARD',
  INACTIVE_STUDENT: 'INACTIVE_STUDENT',
  BLOCKED_CARD: 'BLOCKED_CARD',
};

export const PASS_STATUSES = {
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  SUSPENDED: 'Suspended',
  CANCELLED: 'Cancelled',
  PENDING_ACTIVATION: 'Pending Activation',
};

export const PAYMENT_STATUSES = {
  PAID: 'Paid',
  PARTIALLY_PAID: 'Partially Paid',
  UNPAID: 'Unpaid',
  REFUNDED: 'Refunded',
};

export const CARD_STATUSES = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  LOST: 'Lost',
  BLOCKED: 'Blocked',
  REPLACED: 'Replaced',
};

export const DEVICE_STATUSES = {
  ONLINE: 'Online',
  OFFLINE: 'Offline',
  DEGRADED: 'Degraded',
  UNREGISTERED: 'Unregistered',
};
