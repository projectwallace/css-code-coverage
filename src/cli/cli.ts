#!/usr/bin/env node

import { validate_arguments, parse_arguments } from './arguments.js'
import { program } from './program.js'
import { read } from './file-reader.js'
import { print as pretty } from './reporters/pretty.js'
import { print as tap } from './reporters/tap.js'
import { print as json } from './reporters/json.js'
import { help } from './help.js'

async function cli(cli_args: string[]) {
	if (!cli_args || cli_args.length === 0 || cli_args.includes('--help') || cli_args.includes('-h')) {
		return console.log(help())
	}

	let params = validate_arguments(parse_arguments(cli_args))
	let coverage_data = await read(params['coverage-dir'])
	let report = program(
		{
			min_coverage: params['min-coverage'],
			min_file_coverage: params['min-file-coverage'],
		},
		coverage_data,
	)

	if (report.report.ok === false) {
		process.exitCode = 1
	}

	if (params.reporter === 'tap') {
		return tap(report, params)
	}
	if (params.reporter === 'json') {
		return json(report, params)
	}
	return pretty(report, params)
}

try {
	await cli(process.argv.slice(2))
} catch (error) {
	console.error(error)
	process.exit(1)
}
