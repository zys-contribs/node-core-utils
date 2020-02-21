'use strict';

const yargs = require('yargs');
const getMergeinfo = require('../mergeinfo');
const { runPromise, IGNORE } = require('../../lib/run');

const options = {
  'git-dir': {
    alias: 'g',
    describe: 'The path to your git working directory.',
    default: '.',
    type: 'string'
  }
};

function builder(yargs) {
  return yargs
    .options(options)
    .positional('hash', {
      type: 'string',
      describe: 'Hash of the commit to be searched.'
    })
    .wrap(90);
}

function handler(argv) {
  const { hash } = argv;

  return runPromise(getMergeinfo(hash)
    .then(({ status }) => {
      if (status === false) {
        throw new Error(IGNORE);
      }
    }));
}

module.exports = {
  command: 'mergeinfo <hash>',
  describe: 'Judge whether the commit SHA in release branches',
  builder,
  handler
};
