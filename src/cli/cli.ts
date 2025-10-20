#!/usr/bin/env node

import { validate_arguments, parse_arguments, InvalidArgumentsError } from './arguments.js'
import { program, MissingDataError } from './program.js'
import { read } from './file-reader.js'
import { print as pretty } from './reporters/pretty.js'
import { print as tap } from './reporters/tap.js'

async function cli(cli_args: string[]) {
	const args = parse_arguments(cli_args)
	let params = validate_arguments(args)
	let coverage_data = await read(params['coverage-dir'])
	let report = await program(
		{
			min_file_coverage: params['min-line-coverage'],
			min_file_line_coverage: params['min-file-line-coverage'],
		},
		coverage_data,
	)

	if (report.report.ok === false) {
		process.exitCode = 1
	}

	if (params.reporter === 'pretty') {
		pretty(report, params)
	} else if (params.reporter === 'tap') {
		tap(report, params)
	}
}

try {
	await cli(process.argv.slice(2))
} catch (error) {
	console.error(error)
	process.exit(1)
}
