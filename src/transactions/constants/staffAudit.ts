export const STAFF_ADMIN_ACTIONS = {
  VIP_BUY: 'admin-buy',
  VIP_EXTEND: 'admin-extend',
  VIP_ADD_MEMBER: 'admin-add-member',
  VIP_REMOVE: 'admin-remove',
  RAFFLE_CANCEL: 'raffle-cancel',
  PREDICTION_END: 'prediction-end',
  PREDICTION_PAYOUT: 'prediction-payout',
  PREDICTION_CANCEL: 'prediction-cancel',
  ATM_REJECT: 'atm-reject',
  USER_BAN: 'user-ban',
  USER_UNBAN: 'user-unban',
  USER_NOTE: 'user-note',
  USER_NOTE_UPDATE: 'user-note-update',
  USER_NOTE_DELETE: 'user-note-delete'
} as const

export type StaffAdminAction =
  (typeof STAFF_ADMIN_ACTIONS)[keyof typeof STAFF_ADMIN_ACTIONS]

export const STAFF_ACTION_CATEGORIES = [
  'balance',
  'atm',
  'vip',
  'raffle',
  'prediction',
  'ban',
  'unban',
  'user'
] as const

export type StaffActionCategory = (typeof STAFF_ACTION_CATEGORIES)[number]
