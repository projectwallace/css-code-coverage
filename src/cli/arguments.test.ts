import { test, expect } from '@playwright/test'
import { resolve } from 'node:path'
import { parse_arguments, validate_arguments } from './arguments'

test.describe('--coverage-dir', () => {
	let cov = '--min-coverage=1'

	test('missing --coverage-dir', () => {
		expect(() => validate_arguments(parse_arguments([cov]))).toThrowError()
	})

	test('empty --coverage-dir', () => {
		expect(() => validate_arguments(parse_arguments([cov, '--coverage-dir']))).toThrowError()
	})

	test('valid --coverage-dir=coverage', () => {
		let result = validate_arguments(parse_arguments([cov, '--coverage-dir=coverage']))
		expect(result['coverage-dir']).toEqual(resolve('coverage'))
	})

	test('path traversal --coverage-dir=../../etc', () => {
		expect(() =>
			validate_arguments(parse_arguments([cov, '--coverage-dir=../../etc'])),
		).toThrowError()
	})

	test('path traversal --coverage-dir=../sibling', () => {
		expect(() =>
			validate_arguments(parse_arguments([cov, '--coverage-dir=../sibling'])),
		).toThrowError()
	})
})

test.describe('--min-coverage', () => {
	let dir = '--coverage-dir=coverage'

	test('missing --min-coverage', () => {
		expect(() => validate_arguments(parse_arguments([dir]))).toThrowError()
	})

	test('empty --min-coverage', () => {
		expect(() => validate_arguments(parse_arguments([dir, '--min-coverage']))).toThrowError()
	})

	test('invalid --min-coverage=-1', () => {
		expect(() => validate_arguments(parse_arguments([dir, '--min-coverage=-1']))).toThrowError()
	})

	test('valid --min-coverage=.8', () => {
		let result = validate_arguments(parse_arguments([dir, '--min-coverage=.8']))
		expect(result['min-coverage']).toEqual(0.8)
	})
})

test.describe('--min-file-coverage', () => {
	let args = ['--coverage-dir=coverage', '--min-coverage=1']

	test('missing --min-file-coverage', () => {
		expect.soft(() => validate_arguments(parse_arguments([...args]))).not.toThrowError()
		expect.soft(validate_arguments(parse_arguments([...args]))['min-file-coverage']).toEqual(0)
	})

	test('empty --min-file-coverage', () => {
		expect
			.soft(() => validate_arguments(parse_arguments([...args, '--min-file-coverage'])))
			.toThrowError()
	})

	test('invalid --min-file-coverage=-1', () => {
		expect(() =>
			validate_arguments(parse_arguments([...args, '--min-file-coverage=-1'])),
		).toThrowError()
	})

	test('valid --min-file-coverage=.8', () => {
		let result = validate_arguments(parse_arguments([...args, '--min-file-coverage=.8']))
		expect(result['min-file-coverage']).toEqual(0.8)
	})
})

test.describe('--reporter', () => {
	let args = ['--coverage-dir=coverage', '--min-coverage=1']

	test('missing --reporter', () => {
		expect.soft(() => validate_arguments(parse_arguments([...args]))).not.toThrowError()
		expect.soft(validate_arguments(parse_arguments([...args]))['reporter']).toEqual('pretty')
	})

	test('empty --reporter', () => {
		expect.soft(() => validate_arguments(parse_arguments([...args, '--reporter']))).toThrowError()
	})

	test('invalid --reporter=test', () => {
		expect(() => validate_arguments(parse_arguments([...args, '--reporter=test']))).toThrowError()
	})

	test('valid --reporter=pretty', () => {
		let result = validate_arguments(parse_arguments([...args, '--reporter=pretty']))
		expect(result['reporter']).toEqual('pretty')
	})

	test('valid --reporter=tap', () => {
		let result = validate_arguments(parse_arguments([...args, '--reporter=tap']))
		expect(result['reporter']).toEqual('tap')
	})
})

test.describe('--show-uncovered', () => {
	let args = ['--coverage-dir=coverage', '--min-coverage=1']

	test('missing --show-uncovered', () => {
		expect.soft(() => validate_arguments(parse_arguments([...args]))).not.toThrowError()
		expect
			.soft(validate_arguments(parse_arguments([...args]))['show-uncovered'])
			.toEqual('violations')
	})

	test('empty --show-uncovered', () => {
		expect
			.soft(() => validate_arguments(parse_arguments([...args, '--show-uncovered'])))
			.toThrowError()
	})

	test('invalid --show-uncovered=test', () => {
		expect(() =>
			validate_arguments(parse_arguments([...args, '--show-uncovered=test'])),
		).toThrowError()
	})

	test('valid --show-uncovered=none', () => {
		let result = validate_arguments(parse_arguments([...args, '--show-uncovered=none']))
		expect(result['show-uncovered']).toEqual('none')
	})

	test('valid --show-uncovered=violations', () => {
		let result = validate_arguments(parse_arguments([...args, '--show-uncovered=violations']))
		expect(result['show-uncovered']).toEqual('violations')
	})

	test('valid --show-uncovered=all', () => {
		let result = validate_arguments(parse_arguments([...args, '--show-uncovered=all']))
		expect(result['show-uncovered']).toEqual('all')
	})
})
