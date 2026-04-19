# CSS Code Coverage CLI

```
USAGE
  css-coverage <coverage-dir> --min-coverage=<number> [options]

ARGUMENTS
  <coverage-dir>        Where your Coverage JSON files are

OPTIONS
Required:
  --coverage-dir        Where your Coverage JSON files are
  --min-coverage        Minimum overall CSS coverage [0-1]

Optional:
  --min-file-coverage   Minimal coverage per file [0-1]

  --show-uncovered      Which files to show when not meeting
                        the --min-file-line-coverage threshold
                        • violations [default] show under-threshold files
                        • all show partially covered files
                        • none do not show files

  --reporter            How to show the results
                        • pretty [default]
                        • tap
                        • json

EXAMPLES
  # analyze all .json files in ./coverage; require 80% overall coverage
  $ css-coverage --coverage-dir=./coverage --min-coverage=0.8

  # Require 50% coverage per file
  $ css-coverage --coverage-dir=./coverage --min-coverage=0.8 --min-file-coverage=0.5

  Report JSON
  $ css-coverage --coverage-dir=./coverage --min-coverage=0.8 --reporter=json
```
