#!/bin/bash

set -ex

git clean -fd

echo "----------------------------------------"
echo "------------APP-------------------------"
echo "----------------------------------------"

npx bulk-decaffeinate convert --dir app/coffee

npx bulk-decaffeinate clean

git mv app/coffee app/js

git commit -m "Rename app/coffee dir to app/js"

npx prettier-eslint 'app/js/**/*.js' --write

git add .
git commit -m "Prettier: convert app/js decaffeinated files to Prettier format"

echo "----------------------------------------"
echo "------------UNIT TESTS------------------"
echo "----------------------------------------"

npx bulk-decaffeinate convert --dir test/unit/coffee

npx bulk-decaffeinate clean

git mv test/unit/coffee test/unit/js

git commit -m "Rename test/unit/coffee to test/unit/js"

npx prettier-eslint 'test/unit/js/**/*.js' --write

git add .
git commit -m "Prettier: convert test/unit decaffeinated files to Prettier format"

echo "----------------------------------------"
echo "------------ACCEPTANCE TESTS------------"
echo "----------------------------------------"

npx bulk-decaffeinate convert --dir test/acceptance/coffee

npx bulk-decaffeinate clean

git mv test/acceptance/coffee test/acceptance/js

git commit -m "Rename test/acceptance/coffee to test/acceptance/js"

npx prettier-eslint 'test/acceptance/js/**/*.js' --write

git add .
git commit -m "Prettier: convert test/acceptance decaffeinated files to Prettier format"

echo "----------------------------------------"
echo "------------SMOKE TESTS-----------------"
echo "----------------------------------------"

npx bulk-decaffeinate convert --dir test/smoke/coffee

npx bulk-decaffeinate clean

git mv test/smoke/coffee test/smoke/js

git commit -m "Rename test/smoke/coffee to test/smoke/js"

npx prettier-eslint 'test/smoke/js/**/*.js' --write

git add .
git commit -m "Prettier: convert test/smoke decaffeinated files to Prettier format"

echo "----------------------------------------"
echo "------------CONFIG DIRECTORY------------"
echo "----------------------------------------"

npx bulk-decaffeinate convert --dir config

npx bulk-decaffeinate clean

npx prettier-eslint 'config/**/*.js' --write

git add .
git commit -m "Prettier: convert config decaffeinated files to Prettier format"

echo "----------------------------------------"
echo "------------ENTRYPOINT------------------"
echo "----------------------------------------"

npx bulk-decaffeinate convert --file app.coffee
npx bulk-decaffeinate clean
npx prettier-eslint 'app.js' 'config/settings.defaults.js' --write

git add .
git commit -m "Prettier: convert individual decaffeinated files to Prettier format"

echo "done"
