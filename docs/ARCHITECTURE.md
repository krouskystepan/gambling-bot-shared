# gambling-bot-shared Architecture

Domain-driven layout for shared types, constants, pure utilities, Zod form schemas (`*.forms.ts`), Mongoose models (`*.mongoose.ts`), and injectable services used by the Discord bot and admin panel.

## Domain modules

| Subpath export | Folder | Responsibility |
| -------------- | ------ | -------------- |
| `gambling-bot-shared/common` | `src/common/` | Cross-cutting formatters, ID generation, time parsing, shared Zod helpers |
| `gambling-bot-shared/casino` | `src/casino/` | Game configs, RTP, bet validation, casino bet service, casino forms |
| `gambling-bot-shared/predictions` | `src/predictions/` | Prediction types, parsers, DB factory, lifecycle, summary, forms |
| `gambling-bot-shared/bonus` | `src/bonus/` | Streak math, reward calculation, bonus forms |
| `gambling-bot-shared/guild` | `src/guild/` | Global settings, timezone, channel/manager forms |
| `gambling-bot-shared/transactions` | `src/transactions/` | Transaction types, labels, `TRANSACTION_TYPES` |
| `gambling-bot-shared/raffle` | `src/raffle/` | Raffle types, lifecycle, forms |
| `gambling-bot-shared/blackjack` | `src/blackjack/` | Card constants, blackjack game type (re-exported from casino) |
| `gambling-bot-shared/user` | `src/user/` | User type and schema |
| `gambling-bot-shared/atm` | `src/atm/` | ATM request type, schema, channel form |
| `gambling-bot-shared/vip` | `src/vip/` | VIP room type, schema, settings form |
| `gambling-bot-shared/mongoose` | `src/mongoose/` | Barrel of all Mongoose schemas |

## Import rules

1. **Consumers** must import from domain subpaths (`gambling-bot-shared/casino`, not a root barrel).
2. **Domains** may import from `common/` and their own files.
3. **Cross-domain imports** are limited: `guild` may compose channel schemas from other domains; `predictions`/`raffle` lifecycle services accept a `casinoBet` dependency via constructor injection (no direct runtime import of casino logic).
4. **Mongoose models** use `*.mongoose.ts` next to their domain type; **Zod form validation** uses `schemas/*.forms.ts`. `mongoose/index.ts` re-exports all Mongoose schemas for a single consumer import path.

## Service factory pattern

Stateful logic that touches MongoDB is exposed as factories that accept models:

```ts
import { createCasinoBetService } from 'gambling-bot-shared/casino'
import { createPredictionDb, createPredictionLifecycleService } from 'gambling-bot-shared/predictions'

const casinoBet = createCasinoBetService({ userModel, transactionModel })
const predictionDb = createPredictionDb({ predictionModel })
const lifecycle = createPredictionLifecycleService({ predictionDb, casinoBet })
```

Consumers wire models; shared code stays database-agnostic aside from Mongoose schema definitions.

## Tests

Unit tests live in `test/` (mirroring domain folders), not colocated under `src/`. Run:

```bash
pnpm test:check              # run once
pnpm test:watch              # watch mode
pnpm test:coverage:check     # with v8 coverage report in coverage/
```

`pnpm check` runs format, lint, typecheck, tests, and coverage.
