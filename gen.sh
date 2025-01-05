#!/bin/bash

cd "$(dirname "$0")" || exit

# Pass all arguments to the Python script
python3 scripts/gen.py "$@"
