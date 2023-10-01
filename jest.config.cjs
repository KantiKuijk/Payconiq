module.exports = {
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts?$": ["ts-jest", { useESM: true }],
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(ts)$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
}