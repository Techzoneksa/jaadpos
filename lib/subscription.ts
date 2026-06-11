export type SubscriptionStatus = "trial" | "active" | "expired" | "cancelled" | "past_due";

export type SubscriptionSnapshot = {
  status: SubscriptionStatus;
  trialEndsAt: Date;
  tenantActive: boolean;
};

export function trialEndsFrom(start: Date) {
  const end = new Date(start);
  end.setDate(end.getDate() + 14);
  return end;
}

export function daysRemaining(trialEndsAt: Date, now = new Date()) {
  const ms = trialEndsAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export function canCreateFinancialRecords(subscription: SubscriptionSnapshot, now = new Date()) {
  if (!subscription.tenantActive) {
    return false;
  }

  if (subscription.status === "active") {
    return true;
  }

  if (subscription.status === "trial") {
    return subscription.trialEndsAt.getTime() >= now.getTime();
  }

  return false;
}

export function normalizeSubscriptionStatus(status: string): SubscriptionStatus {
  return status.toLowerCase() as SubscriptionStatus;
}

export const expiredTrialMessage = "انتهت فترة التجربة المجانية. يرجى التواصل مع فريق جاد لتفعيل الاشتراك.";
