// src/app/hooks.ts
//
// Typed wrappers around the vanilla Redux hooks.
// Always import from here — never from 'react-redux' directly — so that
// TypeScript can infer RootState and AppDispatch without manual casting.

import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;