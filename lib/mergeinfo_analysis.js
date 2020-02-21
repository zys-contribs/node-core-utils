'use strict';

const { gitExecute } = require('./search_related_commits');

const GIT_OPTION_HASH_ONLY = '--pretty=format:%H';
const GIT_OPTION_NO_DIFF = '--quiet';
const GIT_OPTION_ONELINE = '--oneline';

async function describeCommit(gitWorkingDir, hash, oneLine = false) {
  if (oneLine) {
    return gitExecute(gitWorkingDir, [
      'show',
      GIT_OPTION_NO_DIFF,
      GIT_OPTION_ONELINE,
      hash
    ]);
  }

  return gitExecute(gitWorkingDir, [
    'show',
    GIT_OPTION_NO_DIFF,
    hash
  ]);
}

async function getBranchesForCommit(gitWorkingDir, hash) {
  const branches = await gitExecute(gitWorkingDir, [
    'branch',
    '--contains',
    hash,
    '-a'
  ]);
  return branches.split('\n');
}

class MergeinfoAnalysis {
  constructor(gitWorkingDir, hash) {
    this.gitWorkingDir = gitWorkingDir;
    this.hash = hash;
  }

  async print() {
    console.log('1.) Searching for "' + this.hash + '"');
    console.log('=====================ORIGINAL COMMIT START===================');
    console.log(await describeCommit(this.gitWorkingDir, this.hash));
    console.log('=====================ORIGINAL COMMIT END=====================');
    console.log('2.) General information:');
    const branches = await getBranchesForCommit(this.gitWorkingDir, this.hash);
    console.log('branches', branches);
  }
}

module.exports = MergeinfoAnalysis;
