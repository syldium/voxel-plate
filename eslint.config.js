// @ts-check

import tseslint from 'typescript-eslint';
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
    ...tseslint.configs.recommended,
    eslintConfigPrettier
);
