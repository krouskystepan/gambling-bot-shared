import {
  QUEST_CONDITION_ALLOWED_KINDS,
  type QUEST_CONDITION_TYPES
} from '../constants/questLimits'
import type { QuestConditionType, QuestKind } from '../types/quest'

export const isQuestConditionAllowedForKind = (
  type: QuestConditionType,
  kind: QuestKind
): boolean => {
  const allowed = QUEST_CONDITION_ALLOWED_KINDS[type]
  return (allowed as readonly QuestKind[]).includes(kind)
}

export const getAllowedConditionTypesForKind = (
  kind: QuestKind
): QuestConditionType[] =>
  (Object.keys(QUEST_CONDITION_ALLOWED_KINDS) as QuestConditionType[]).filter(
    (type) => isQuestConditionAllowedForKind(type, kind)
  )

export type QuestConditionTypeUnion = (typeof QUEST_CONDITION_TYPES)[number]
