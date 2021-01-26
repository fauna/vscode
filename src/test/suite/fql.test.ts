import { assert } from 'chai';
import { Client } from "faunadb";
import { afterEach, before } from 'mocha';
import sinon from 'sinon';
import { evalFQLCode, InvalidFQL, runFQLQuery } from '../../fql';

suite('FQL', () => {

	suite('runFQLQuery', () => {

		let client: Client;
		const queryFake = sinon.fake.resolves({})
		before(() => {
			client = new Client({secret: ''})
			client.query = queryFake
		})

		afterEach(() => {
			queryFake.resetHistory()
		})

		test('throw an error for empty query', () => {
			assert.throws(() => runFQLQuery('', client as Client), InvalidFQL, 'No queries found')
		});

		test('throw an error for not closed bracket', () => {
			assert.throws(() => runFQLQuery(
				"Paginate(Indexes()", client), 
				InvalidFQL, 
				`Expect all opened brackets to be closed`
			)
		});

		test('throw an error for invalid closed bracket', () => {
			assert.throws(() => runFQLQuery(
				"Paginate(Indexes(})", client), 
				InvalidFQL, 
				'Unexpected closing bracket } at position: 18'
			)
		});

		test('run one query in one line', () => {
			const fql = 'Paginate(Indexes())'
			runFQLQuery(fql, client)
			assert.deepEqual(queryFake.firstCall.firstArg, evalFQLCode(fql))
		})

		test('run multiple queries in one line', () => {
			const fql1 = 'Paginate(Indexes())'
			const fql2 = 'Paginate(Collections())'
			runFQLQuery([fql1, fql2].join(' '), client)
			assert.deepEqual(queryFake.getCall(0).firstArg, evalFQLCode(fql1))
			assert.deepEqual(queryFake.getCall(1).firstArg, evalFQLCode(fql2))
		})

		test('run one query in multi-lines', () => {
			const fql = `
				Paginate(
					Indexes()
				)
			`
			runFQLQuery(fql, client)
			assert.deepEqual(queryFake.firstCall.firstArg, evalFQLCode(fql))
		})

		test('run multiple queries in multi-lines', () => {
			const fql = `
				Paginate(
					Indexes()
				)
				Paginate(
					Collections()
				)
			`
			runFQLQuery(fql, client)
			console.info(queryFake.getCall(0).firstArg)
			assert.deepEqual(queryFake.getCall(0).firstArg, evalFQLCode('Paginate(Indexes())'))
			assert.deepEqual(queryFake.getCall(1).firstArg, evalFQLCode('Paginate(Collections())'))
		})
	})
});