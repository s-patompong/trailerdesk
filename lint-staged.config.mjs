export default {
  "*.{ts,tsx}": ["eslint --fix --max-warnings=0", "prettier --write"],
  "*.{json,jsonc,md,yml,yaml,css,mjs}": ["prettier --write"],
};
