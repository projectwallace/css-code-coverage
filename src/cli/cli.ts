import { validate_arguments, parse_arguments, InvalidArgumentsError } from './arguments.ts'
import { program, MissingDataError } from './program.ts'
import { read } from './file-reader.ts'
import { print as pretty } from './reporters/pretty.ts'
import { print as tap } from './reporters/tap.ts'

async function cli(cli_args: string[]) {
	const args = parse_arguments(cli_args)
	let params = validate_arguments(args)
	let coverage_data = await read(params['coverage-dir'])
	let report = program(
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
