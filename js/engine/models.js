// =============================================================================
// TONTITRUST DATA MODELS & ENUMS
// PRD Reference: TT-PRD-TSD-001 v1.0
// =============================================================================

export const UserStatus = {
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  CLOSED: 'CLOSED'
};

export const TontineStatus = {
  DRAFT: 'DRAFT',
  RECRUITING: 'RECRUITING',
  READY: 'READY',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

export const Frequency = {
  WEEKLY: 'WEEKLY',
  BIWEEKLY: 'BIWEEKLY',
  MONTHLY: 'MONTHLY',
  CUSTOM_TEST: 'CUSTOM_TEST'
};

export const MembershipStatus = {
  INVITED: 'INVITED',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  REMOVED: 'REMOVED',
  REJECTED: 'REJECTED'
};

export const CycleStatus = {
  SCHEDULED: 'SCHEDULED',
  COLLECTING: 'COLLECTING',
  ELIGIBLE: 'ELIGIBLE',
  PAYING: 'PAYING',
  COMPLETED: 'COMPLETED',
  BLOCKED: 'BLOCKED'
};

export const ContributionStatus = {
  PENDING: 'PENDING',
  INITIATED: 'INITIATED',
  PROCESSING: 'PROCESSING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  OVERDUE: 'OVERDUE',
  WAIVED: 'WAIVED',
  REFUNDED: 'REFUNDED'
};

export const TransactionStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED'
};

export const PayoutStatus = {
  PENDING: 'PENDING',
  ELIGIBLE: 'ELIGIBLE',
  PROCESSING: 'PROCESSING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REVERSED: 'REVERSED'
};

export const ActorType = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  SYSTEM: 'SYSTEM'
};

export const TicketStatus = {
  OPEN: 'OPEN',
  IN_REVIEW: 'IN_REVIEW',
  WAITING_USER: 'WAITING_USER',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
  CLOSED: 'CLOSED'
};

// Utilities
export function formatCurrency(amountMinor, currency = 'CDF') {
  const major = (amountMinor / 100).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  return `${major} ${currency}`;
}

export function formatDate(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function maskPhone(phone) {
  if (!phone || phone.length < 8) return phone;
  return phone.slice(0, 4) + ' ••• •• ' + phone.slice(-2);
}

export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
