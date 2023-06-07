# test-eosjs
my own testing scripts to validate an npm package pre-release

## How to Run
- clone this repo
- switch to `mandel-eosjs` repo and run `npm build` to create the new enf-eosjs package
- copy the package to the checked out location of `test-eosjs`
- install `npm install ./enf-eosjs@version.tgz`
- review and update endpoint in `node-test.js`
- run the tests `node node-test.js`

Output as console logs, nothing fancy. Read Only transaction required the test contract from enf-eosjs.