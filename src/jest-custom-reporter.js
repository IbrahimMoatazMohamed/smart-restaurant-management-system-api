class CustomReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onRunComplete(contexts, results) {
    console.log('\nTest Results:');

    results.testResults.forEach((testFileResult) => {
      console.log(`\nFile: ${testFileResult.testFilePath}`);

      testFileResult.testResults.forEach((testResult) => {
        const status = testResult.status === 'passed' ? '√' : 'x';
        const color = testResult.status === 'passed' ? '\x1b[32m' : '\x1b[31m';
        console.log(`${color}${status}\x1b[0m ${testResult.fullName}`);
      });
    });

    console.log(`\n\x1b[32m√\x1b[0m Passed: ${results.numPassedTests}`);
    if (results.numFailedTests > 0) {
      console.log(`\x1b[31mx\x1b[0m Failed: ${results.numFailedTests}`);
    }
    console.log(`Total: ${results.numTotalTests}`);
  }
}

module.exports = CustomReporter;
