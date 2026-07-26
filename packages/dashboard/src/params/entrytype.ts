import type { ParamMatcher } from '@sveltejs/kit';
import { ENTRY_TYPES } from '$lib/types';

export const match: ParamMatcher = (param) => (ENTRY_TYPES as string[]).includes(param);
