/**
 * Shared shape for server-action results used across all feature modules.
 */
export type ActionState = {
  ok?: boolean;
  error?: string;
  levelUp?: { level: number };
};

export const EMPTY_ACTION_STATE: ActionState = {};
