import { styleText } from 'node:util'

export function help() {
	return `
${styleText(['bold'], 'USAGE')}
  css-coverage <coverage-dir> --min-coverage=<number> [options]

${styleText('bold', 'ARGUMENTS')}
  <coverage-dir>        Where your coverage JSON files are

${styleText('bold', 'OPTIONS')}
Required:
  --min-coverage        Minimum overall CSS coverage [0-1]

Optional:
  --min-file-coverage   Minimal coverage per file [0-1]

  --show-uncovered      Which files to show when not meeting 
                        the --min-file-line-coverage threshold
                        • violations [default] ${styleText('dim', 'show under-threshold files')}
                        • all ${styleText('dim', 'show partially covered files')}
                        • none ${styleText('dim', 'do not show files')}

  --reporter            How to show the results 
                        • pretty [default]
                        • tap
                        • json

${styleText('bold', 'EXAMPLES')}
  ${styleText('dim', '# analyze all .json files in ./coverage; require 80% overall coverage')}
  css-coverage ./coverage --min-coverage=0.8

  ${styleText('dim', '# Require 50% coverage per file')}
  css-coverage ./coverage --min-coverage=0.8 --min-file-coverage=0.5

  ${styleText('dim', 'Report JSON')}
  css-coverage ./coverage --min-coverage=0.8 --reporter=json
  `.trim()
}
