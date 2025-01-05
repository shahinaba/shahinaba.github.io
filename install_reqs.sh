#!/bin/bash

cd "$(dirname "$0")" || exit

# Install the required packages
pip3 install -r requirements.txt