module.exports = {
    transform: {
        '^.+\\.tsx?$': 'babel-jest',
    },
    testEnvironment: 'node',
    testMatch: ['**/__tests__/bracketUtils.test.ts'],
};
