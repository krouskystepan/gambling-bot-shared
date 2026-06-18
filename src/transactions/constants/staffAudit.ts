export const STAFF_ADMIN_ACTIONS = {
  VIP_BUY: 'admin-buy',
  VIP_EXTEND: 'admin-extend',
  VIP_ADD_MEMBER: 'admin-add-member',
  VIP_REMOVE: 'admin-remove',
  RAFFLE_CANCEL: 'raffle-cancel',
  PREDICTION_END: 'prediction-end',
  PREDICTION_PAYOUT: 'prediction-payout',
  PREDICTION_CANCEL: 'prediction-cancel',
  ATM_REJECT: 'atm-reject'
} as const

export type StaffAdminAction =
  (typeof STAFF_ADMIN_ACTIONS)[keyof typeof STAFF_ADMIN_ACTIONS]

export const STAFF_ACTION_CATEGORIES = [
  'balance',
  'atm',
  'vip',
  'raffle',
  'prediction'
] as const

export type StaffActionCategory = (typeof STAFF_ACTION_CATEGORIES)[number]
