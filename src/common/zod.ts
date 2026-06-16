import z from 'zod'

export const num = z
  .union([z.number(), z.string()])
  .transform((val) => {
    if (val === '' || val === undefined || val === null) return 0
    const parsed = typeof val === 'string' ? Number(val) : val
    return Number.isNaN(parsed) ? 0 : parsed
  })
  .pipe(z.number())
