import { styleText } from 'node:util'

export function help() {
	return `
${styleText(['bold'], 'USAGE')}
  $ css-coverage --coverage-dir=<dir> --min-line-coverage=<number> [options]

${styleText('bold', 'OPTIONS')}
Required:
  --coverage-dir            Where your Coverage JSON files are
  --min-line-coverage       Minimum overall CSS coverage [0-1]

Optional:
  --min-file-line-coverage  Minimal coverage per file [0-1]

  --show-uncovered          Which files to show when not meeting 
                            the --min-file-line-coverage threshold
                            • violations [default] ${styleText('dim', 'show under-threshold files')}
                            • all ${styleText('dim', 'show partially covered files')}
                            • none ${styleText('dim', 'do not show files')}

  --reporter                How to show the results 
                            • pretty [default]
                            • tap
                            • json

${styleText('bold', 'EXAMPLES')}
  ${styleText('dim', '# analyze all .json files in ./coverage; require 80% overall coverage')}
  $ css-coverage --coverage-dir=./coverage --min-line-coverage=0.8

  ${styleText('dim', '# Require 50% coverage per file')}
  $ css-coverage \\
      --coverage-dir=./coverage \\
      --min-line-coverage=0.8 \\
      --min-file-line-coverage=0.5

  ${styleText('dim', 'Report JSON')}
  $ css-coverage \\
      --coverage-dir=./coverage \\
      --min-line-coverage=0.8 \\
      --reporter=json
  `.trim()
}
