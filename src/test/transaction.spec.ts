import { beforeAll, beforeEach, afterAll, test, expect, describe } from 'vitest'
import { execSync } from 'node:child_process'
import supertest from 'supertest'
import { app } from '../app'

describe('Transactions routes', () => {
  beforeAll(async () => {
    app.ready()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all') // apaga o banco
    execSync('npm run knex migrate:latest') // cria novamente
    // antes de cada teste apago o banco de dados e crio todas tabelas novamente
  })

  test('The user can create new transaction', async () => {
    const data = {
      title: 'Test transaction',
      amount: 5000,
      type: 'credit',
    }
    const response = await supertest(app.server).post('/transaction').send(data)
    expect(response.statusCode).toEqual(201)
  })

  test('The user can list all transaction', async () => {
    const data = {
      title: 'Test transaction',
      amount: 5000,
      type: 'credit',
    }
    const createTransactionResponse = await supertest(app.server)
      .post('/transaction')
      .send(data)

    const cookies = createTransactionResponse.get('Set-Cookie')

    const getAllTransactionReponse = await supertest(app.server)
      .get('/transaction')
      .set('Cookie', cookies)

    expect(getAllTransactionReponse.statusCode).toEqual(200)

    expect(getAllTransactionReponse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'Test transaction',
        amount: 5000,
      }),
    ])
  })

  test('The user can a get specific transaction', async () => {
    const data = {
      title: 'Test transaction',
      amount: 5000,
      type: 'credit',
    }
    const createTransactionResponse = await supertest(app.server)
      .post('/transaction')
      .send(data)

    const cookies = createTransactionResponse.get('Set-Cookie')

    const getAllTransactionReponse = await supertest(app.server)
      .get('/transaction')
      .set('Cookie', cookies)

    const transactionID = getAllTransactionReponse.body.transactions[0].id

    const getTransactionByID = await supertest(app.server)
      .get(`/transaction/${transactionID}`)
      .set('Cookie', cookies)

    expect(getTransactionByID.statusCode).toEqual(200)

    expect(getTransactionByID.body.transactions).toEqual(
      expect.objectContaining({
        title: 'Test transaction',
        amount: 5000,
      }),
    )
  })

  test('The user can get a summary of all transactions', async () => {
    const data = {
      title: 'Test transaction',
      amount: 5000,
      type: 'credit',
    }

    const data2 = {
      title: 'Test transaction',
      amount: 2000,
      type: 'debit',
    }

    const createTransactionResponse = await supertest(app.server)
      .post('/transaction')
      .send(data)

    const cookies = createTransactionResponse.get('Set-Cookie')

    await supertest(app.server)
      .post('/transaction')
      .set('Cookie', cookies)
      .send(data2)

    const getResumeTransactionReponse = await supertest(app.server)
      .get('/transaction/resume')
      .set('Cookie', cookies)

    expect(getResumeTransactionReponse.statusCode).toEqual(200)

    expect(getResumeTransactionReponse.body.resume).toEqual(
      expect.objectContaining({
        amount: 3000,
      }),
    )
  })

  afterAll(async () => {
    app.close()
  })
})
