#!/usr/bin/env node

import { parse_arguments } from './arguments.js'
import { program } from './program.js'
import { read } from './file-reader.js'
import { print as pretty } from './reporters/pretty.js'
import { print as tap } from './reporters/tap.js'
import { print as json } from './reporters/json.js'
import { help } from './help.js'

async function cli(cli_args: string[]) {
	let start_time = performance.now()
	if (cli_args.length === 0 || cli_args.includes('--help') || cli_args.includes('-h')) {
		return console.log(help())
	}

	let params = parse_arguments(cli_args)
	let { json_files_found, coverage: coverage_data } = await read(params['coverage-dir'])
	let report = program(
		{
			min_coverage: params['min-coverage'],
			min_file_coverage: params['min-file-coverage'],
			start_time,
			json_files_found,
		},
		coverage_data,
	)

	if (report.report.ok === false) {
		process.exitCode = 1
	}

	let reporters = { pretty, tap, json }
	reporters[params.reporter](report, params)
}

try {
	await cli(process.argv.slice(2))
} catch (error) {
	console.error(error)
	process.exit(1)
}
