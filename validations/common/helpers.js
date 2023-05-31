import * as FF from '@flatfile/configure';
import { FlatfileRecord } from '@flatfile/hooks';

/*
 * Types
 */

/**
 * @typedef {null|undefined} Nil
 */

/**
 * @typedef {null|undefined|false|''|0} Falsy
 */

/*
 * Guards
 */

/**
 * Helper function to determine if a value is null.
 * Useful in if/else statements or ternaries.
 *
 * @param {*} x - Any object/value
 *
 * @example
 * if (isNull(x)) {
 *   ...
 * } else {
 *   ...
 * }
 */
export const isNull = (x) => x === null;

/**
 * Helper function to determine if a value is undefined.
 * Useful in if/else statements or ternaries.
 *
 * @param {*} x - Any object/value
 *
 * @example
 * if (isUndefined(x)) {
 *   ...
 * } else {
 *   ...
 * }
 */
export const isUndefined = (x) => x === undefined;

/**
 * Helper function to determine if a value is null, undefined or an empty string.
 * Useful in if/else statements or ternaries.
 *
 * @param {*} x - Any object/value
 *
 * @example
 * if (isNil(x)) {
 *   ...
 * } else {
 *   ...
 * }
 */
export const isNil = (x) =>
  isNull(x) || isUndefined(x) || (isString(x) && x.trim() === '');

/**
 * Helper function to determine if a value is NOT null or undefined.
 * Useful in if/else statements or ternaries.
 *
 * @param {*} x - Any object/value
 *
 * @example
 * if (isNotNil(x)) {
 *   ...
 * } else {
 *   ...
 * }
 */
export const isNotNil = (x) => !isNil(x);

/**
 * Helper function to determine if a value is falsy.
 * Useful in if/else statements or ternaries.
 *
 * @param {*} x - Any object/value
 *
 * @example
 * if (isFalsy(x)) {
 *   ...
 * } else {
 *   ...
 * }
 */
export const isFalsy = (x) =>
  x === 0 || Number.isNaN(x) || x === false || isNil(x);

/**
 * Helper function to determine if a value is truthy.
 * Useful in if/else statements or ternaries.
 *
 * @param {*} x - Any object/value
 *
 * @example
 * if (isTruthy(x)) {
 *   ...
 * } else {
 *   ...
 * }
 */
export const isTruthy = (x) => !isFalsy(x);

/**
 * Helper function to determine if a value is a string.
 * Useful in if/else statements or ternaries.
 *
 * @param {*} x - Any object/value
 *
 * @example
 * if (isString(x)) {
 *   ...
 * } else {
 *   ...
 * }
 */
export const isString = (x) => typeof x === 'string';

/**
 * Helper function to determine if a value is a number.
 * Useful in if/else statements or ternaries.
 *
 * @param {*} x - Any object/value
 *
 * @example
 * if (isNumber(x)) {
 *   ...
 * } else {
 *   ...
 * }
 */
export const isNumber = (x) => typeof x === 'number';

/*
 * Helpers
 */

/**
 * Easily pass the result of one function to the input of another.
 *
 * @example
 * pipe(fn1, fn2, ...);
 */
// Define a pipe function that allows us to chain functions together
export const pipe = (...fns) => fns.reduce((acc, fn) => fn(acc));

/**
 * Convert a string to lowercase.
 *
 * @param {string} value - The string to apply the operation to.
 *
 * @example
 * pipe(value, toLowerCase);
 */
export const toLowerCase = (value) => value.toLowerCase();

/**
 * Remove whitespace from the beginning and end of a string.
 *
 * @param {string} value - The string to apply the operation to.
 *
 * @example
 * pipe(value, trim);
 */
export const trim = (value) => value.trim();

/**
 * Combine multiple validations into a single array.
 *
 * @example
 * runValidations(fn1, fn2, fn3, ...);
 */
export const runValidations = (...fns) => {
  // Execute each validation function and collect any messages that are returned
  return fns.reduce((acc, fn) => [...acc, fn()], []).filter(isNotNil);
};

/**
 * Run multiple record hooks synchronously on a `FlatfileRecord`.
 *
 * @example
 * runRecordHooks(fn1, fn2, fn3, ...)(record)
 */
export const runRecordHooks = (...fns) => {
  return (record) => {
    // Execute each hook function on the record
    fns.forEach((fn) => fn(record));
  };
};