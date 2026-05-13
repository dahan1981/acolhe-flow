export type AccountPreferences = {
  resumoDiario: boolean;
  alertaPrioridade: boolean;
  modoDiscreto: boolean;
};

export const ACCOUNT_PREFERENCES_EVENT = "athena-account-preferences-changed";

const DEFAULT_PREFERENCES: AccountPreferences = {
  resumoDiario: true,
  alertaPrioridade: true,
  modoDiscreto: false,
};

function storageKey(userId: string) {
  return `athena-account-preferences:${userId}`;
}

export function getDefaultAccountPreferences(): AccountPreferences {
  return { ...DEFAULT_PREFERENCES };
}

export function getAccountPreferences(userId?: string | null): AccountPreferences {
  if (!userId || typeof window === "undefined") {
    return getDefaultAccountPreferences();
  }

  const raw = window.localStorage.getItem(storageKey(userId));
  if (!raw) {
    return getDefaultAccountPreferences();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AccountPreferences>;
    return {
      resumoDiario: parsed.resumoDiario ?? DEFAULT_PREFERENCES.resumoDiario,
      alertaPrioridade: parsed.alertaPrioridade ?? DEFAULT_PREFERENCES.alertaPrioridade,
      modoDiscreto: parsed.modoDiscreto ?? DEFAULT_PREFERENCES.modoDiscreto,
    };
  } catch {
    return getDefaultAccountPreferences();
  }
}

export function saveAccountPreferences(userId: string, preferences: AccountPreferences) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(storageKey(userId), JSON.stringify(preferences));
  window.dispatchEvent(
    new CustomEvent(ACCOUNT_PREFERENCES_EVENT, {
      detail: {
        userId,
        preferences,
      },
    }),
  );
}
