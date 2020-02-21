'use strict';

const MergeinfoAnalysis = require('../lib/mergeinfo_analysis');

module.exports = async function getMergeinfo(hash) {
  const analysis = new MergeinfoAnalysis('.', hash);

  await analysis.print();

  return  {
    status: true
  };
}
