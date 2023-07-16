import { FastifyReply } from 'fastify/types/reply'
import { FastifyRequest } from 'fastify/types/request'

export async function checkIfExistSessionID(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { sessionID } = request.cookies

  if (!sessionID) {
    return reply.code(401).send({
      error: 'Unauthorized',
    })
  }
}
