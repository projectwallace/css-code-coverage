import { test, expect } from '@playwright/test'
import { parse_arguments, validate_arguments } from './arguments'

test.describe('--coverage-dir', () => {
	let cov = '--min-line-coverage=1'

	test('missing --coverage-dir', () => {
		expect(() => validate_arguments(parse_arguments([cov]))).toThrowError()
	})

	test('empty --coverage-dir', () => {
		expect(() => validate_arguments(parse_arguments([cov, '--coverage-dir']))).toThrowError()
	})

	test('valid --coverage-dir=path/to/coverage', () => {
		let result = validate_arguments(parse_arguments([cov, '--coverage-dir=/path/to/coverage']))
		expect(result['coverage-dir']).toEqual('/path/to/coverage')
	})
})

test.describe('--min-line-coverage', () => {
	let dir = '--coverage-dir=coverage'

	test('missing --min-line-coverage', () => {
		expect(() => validate_arguments(parse_arguments([dir]))).toThrowError()
	})

	test('empty --min-line-coverage', () => {
		expect(() => validate_arguments(parse_arguments([dir, '--min-line-coverage']))).toThrowError()
	})

	test('invalid --min-line-coverage=-1', () => {
		expect(() => validate_arguments(parse_arguments([dir, '--min-line-coverage=-1']))).toThrowError()
	})

	test('valid --min-line-coverage=.8', () => {
		let result = validate_arguments(parse_arguments([dir, '--min-line-coverage=.8']))
		expect(result['min-line-coverage']).toEqual(0.8)
	})
})

test.describe('--min-file-line-coverage', () => {
	let args = ['--coverage-dir=coverage', '--min-line-coverage=1']

	test('missing --min-file-line-coverage', () => {
		expect.soft(() => validate_arguments(parse_arguments([...args]))).not.toThrowError()
		expect.soft(validate_arguments(parse_arguments([...args]))['min-file-line-coverage']).toEqual(0)
	})

	test('empty --min-file-line-coverage', () => {
		expect.soft(() => validate_arguments(parse_arguments([...args, '--min-file-line-coverage']))).toThrowError()
	})

	test('invalid --min-file-line-coverage=-1', () => {
		expect(() => validate_arguments(parse_arguments([...args, '--min-file-line-coverage=-1']))).toThrowError()
	})

	test('valid --min-file-line-coverage=.8', () => {
		let result = validate_arguments(parse_arguments([...args, '--min-file-line-coverage=.8']))
		expect(result['min-file-line-coverage']).toEqual(0.8)
	})
})

test.describe('--reporter', () => {
	let args = ['--coverage-dir=coverage', '--min-line-coverage=1']

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
	let args = ['--coverage-dir=coverage', '--min-line-coverage=1']

	test('missing --show-uncovered', () => {
		expect.soft(() => validate_arguments(parse_arguments([...args]))).not.toThrowError()
		expect.soft(validate_arguments(parse_arguments([...args]))['show-uncovered']).toEqual('violations')
	})

	test('empty --show-uncovered', () => {
		expect.soft(() => validate_arguments(parse_arguments([...args, '--show-uncovered']))).toThrowError()
	})

	test('invalid --show-uncovered=test', () => {
		expect(() => validate_arguments(parse_arguments([...args, '--show-uncovered=test']))).toThrowError()
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
