import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { knex } from '../database'
import { checkIfExistSessionID } from '../middlewares/check_if_exists_sessionID'

export async function transactionsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    { preHandler: [checkIfExistSessionID] },
    async (request, reply) => {
      const { sessionID } = request.cookies

      const transactions = await knex('transactions')
        .where('session_id', sessionID)
        .select('*')

      if (transactions) return reply.status(200).send({ transactions })
      return reply.status(404).send()
    },
  )

  app.get(
    '/:id',
    { preHandler: [checkIfExistSessionID] },
    async (request, reply) => {
      const { sessionID } = request.cookies

      const getTransactionParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getTransactionParamsSchema.parse(request.params)

      const transactions = await knex('transactions')
        .where({
          session_id: sessionID,
          id,
        })
        .first()
      if (transactions) return reply.status(200).send({ transactions })
      return reply.status(404).send()
    },
  )

  app.get(
    '/resume',
    { preHandler: [checkIfExistSessionID] },
    async (request, reply) => {
      const { sessionID } = request.cookies
      const resume = await knex('transactions')
        .where('session_id', sessionID)
        .sum('amount', { as: 'amount' })
        .first()
      if (resume) return reply.status(200).send({ resume })
      return reply.status(404).send()
    },
  )

  app.post('/', async (request, reply) => {
    const createTransactionSchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { title, amount, type } = createTransactionSchema.parse(request.body)

    let sessionID = request.cookies.sessionID

    if (!sessionID) {
      sessionID = randomUUID()
      reply.cookie('sessionID', sessionID, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('transactions').insert({
      id: randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionID,
    })

    return reply.status(201).send()
  })
}
