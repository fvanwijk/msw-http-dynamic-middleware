export default function(wallaby) {
  return {
    files: ['src/**/*.ts'],
    tests: ['test/**/*.spec.ts'],
    env: {
      type: 'node',
    },
    testFramework: 'jest',
    compilers: {
      '**/*.ts?(x)': wallaby.compilers.typeScript({
        module: 'commonjs',
      }),
    },
  };
}
