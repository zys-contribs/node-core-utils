'use strict';

const util = require('util');
const exec = util.promisify(require('child_process').exec);

function searchAllRelatedCommits(
  gitWorkingDir,
  startHash,
  until,
  separator,
  verbose = false
) {
  const allCommitsRaw = findCommitsInbetween(
    startHash, until, gitWorkingDir, verbose
  );
  if (verbose) {
    console.log('All commits between <of> and <until>: ' + allCommitsRaw);
  }

  // Adding start hash too
  const allCommits = [startHash];
  allCommits.push(allCommitsRaw.split('\n'));

  const allRelatedCommits = {}
  const alreadyTreatedCommits = new Set([]);
  for (const commit of allCommits) {
    if (alreadyTreatedCommits.has(commit)) {
      continue;
    }

    const relatedCommits = searchRelatedCommits(
      gitWorkingDir, commit, until, separator, verbose
    );

    if (relatedCommits.length > 0) {
      allRelatedCommits[commit] = relatedCommits;
      alreadyTreatedCommits.add(relatedCommits);
    }

    alreadyTreatedCommits.add(commit);
  }

  return allRelatedCommits;
}

function searchRelatedCommits(
  gitWorkingDir, startHash, until, separator, verbose
) {
  let commitsBetween;
  if (separator) {
    commitsBetween = findCommitsInbetween(
      startHash, separator, gitWorkingDir, verbose
    );
    if (commitsBetween === '') {
      return [];
    }
  }

  // Extract commit position
  const originalMessage = gitExecute(
    gitWorkingDir,
    ['show', 's', '--format=%B', startHash],
    verbose
  );
  const title = originalMessage.split('\n')[0]
  return [];
  // const matches =
}

function findCommitsInbetween(startHash, endHash, gitWorkingDir, verbose) {
  return gitExecute(
    gitWorkingDir,
    ['rev-list', '--reverse', startHash + '..' + endHash],
    verbose
  );
}

async function gitExecute(workingDir, args, verbose = false) {
  const command = ['git', '-C', workingDir].concat(args).join(' ');
  if (verbose) {
    console.log('Git working dir: ' + workingDir);
    console.log('Executing git command: ' + command);
  }

  const { stdout, stderr } = await exec(command);

  if (verbose) {
    console.log('Git return value: ' + stdout);
  }
  return stdout;
}

module.exports = {
  gitExecute,
  searchAllRelatedCommits
};
