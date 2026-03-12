import { test, expect } from '@playwright/test'
import { resolve } from 'node:path'
import { parse_arguments } from './arguments'

test.describe('--coverage-dir', () => {
	let cov = '--min-coverage=1'

	test('missing --coverage-dir', () => {
		expect(() => parse_arguments([cov])).toThrowError()
	})

	test('empty --coverage-dir', () => {
		expect(() => parse_arguments([cov, '--coverage-dir'])).toThrowError()
	})

	test('valid --coverage-dir=coverage', () => {
		let result = parse_arguments([cov, '--coverage-dir=coverage'])
		expect(result['coverage-dir']).toEqual(resolve('coverage'))
	})

	test('path traversal --coverage-dir=../../etc', () => {
		expect(() => parse_arguments([cov, '--coverage-dir=../../etc'])).toThrowError()
	})

	test('path traversal --coverage-dir=../sibling', () => {
		expect(() => parse_arguments([cov, '--coverage-dir=../sibling'])).toThrowError()
	})
})

test.describe('--min-coverage', () => {
	let dir = '--coverage-dir=coverage'

	test('missing --min-coverage', () => {
		expect(() => parse_arguments([dir])).toThrowError()
	})

	test('empty --min-coverage', () => {
		expect(() => parse_arguments([dir, '--min-coverage'])).toThrowError()
	})

	test('invalid --min-coverage=-1', () => {
		expect(() => parse_arguments([dir, '--min-coverage=-1'])).toThrowError()
	})

	test('valid --min-coverage=.8', () => {
		let result = parse_arguments([dir, '--min-coverage=.8'])
		expect(result['min-coverage']).toEqual(0.8)
	})
})

test.describe('--min-file-coverage', () => {
	let args = ['--coverage-dir=coverage', '--min-coverage=1']

	test('missing --min-file-coverage defaults to 0', () => {
		let result = parse_arguments([...args])
		expect(result['min-file-coverage']).toEqual(0)
	})

	test('empty --min-file-coverage', () => {
		expect(() => parse_arguments([...args, '--min-file-coverage'])).toThrowError()
	})

	test('invalid --min-file-coverage=-1', () => {
		expect(() => parse_arguments([...args, '--min-file-coverage=-1'])).toThrowError()
	})

	test('valid --min-file-coverage=.8', () => {
		let result = parse_arguments([...args, '--min-file-coverage=.8'])
		expect(result['min-file-coverage']).toEqual(0.8)
	})
})

test.describe('--reporter', () => {
	let args = ['--coverage-dir=coverage', '--min-coverage=1']

	test('missing --reporter defaults to pretty', () => {
		let result = parse_arguments([...args])
		expect(result['reporter']).toEqual('pretty')
	})

	test('empty --reporter', () => {
		expect(() => parse_arguments([...args, '--reporter'])).toThrowError()
	})

	test('invalid --reporter=test', () => {
		expect(() => parse_arguments([...args, '--reporter=test'])).toThrowError()
	})

	test('valid --reporter=pretty', () => {
		let result = parse_arguments([...args, '--reporter=pretty'])
		expect(result['reporter']).toEqual('pretty')
	})

	test('valid --reporter=tap', () => {
		let result = parse_arguments([...args, '--reporter=tap'])
		expect(result['reporter']).toEqual('tap')
	})
})

test.describe('--show-uncovered', () => {
	let args = ['--coverage-dir=coverage', '--min-coverage=1']

	test('missing --show-uncovered defaults to violations', () => {
		let result = parse_arguments([...args])
		expect(result['show-uncovered']).toEqual('violations')
	})

	test('empty --show-uncovered', () => {
		expect(() => parse_arguments([...args, '--show-uncovered'])).toThrowError()
	})

	test('invalid --show-uncovered=test', () => {
		expect(() => parse_arguments([...args, '--show-uncovered=test'])).toThrowError()
	})

	test('valid --show-uncovered=none', () => {
		let result = parse_arguments([...args, '--show-uncovered=none'])
		expect(result['show-uncovered']).toEqual('none')
	})

	test('valid --show-uncovered=violations', () => {
		let result = parse_arguments([...args, '--show-uncovered=violations'])
		expect(result['show-uncovered']).toEqual('violations')
	})

	test('valid --show-uncovered=all', () => {
		let result = parse_arguments([...args, '--show-uncovered=all'])
		expect(result['show-uncovered']).toEqual('all')
	})
})
