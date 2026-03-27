import { describe, it, expect, vi } from 'vitest';
import {
  isDefined,
  isString,
  isNumber,
  isInteger,
  isBoolean,
  isArray,
  isObject,
  isFunction,
  safeJsonParse,
  safeJsonStringify,
  getNestedValue,
  groupBy,
  sortBy,
  unique,
  chunk,
  flattenDeep,
  shuffle,
  sample,
  first,
  last,
  arraysEqual,
  intersect,
  union,
  difference,
  partition,
  countBy,
  sum,
  average,
  min,
  max,
  rangeNumber,
  clamp,
  lerp,
  mapRange,
  formatBytes,
  parseBytes,
  sleep,
  retry,
  generateId,
} from '../helpers';

describe('Type Guards', () => {
  describe('isDefined', () => {
    it('should return true for defined values', () => {
      expect(isDefined(0)).toBe(true);
      expect(isDefined('')).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined([])).toBe(true);
      expect(isDefined({})).toBe(true);
    });

    it('should return false for undefined and null', () => {
      expect(isDefined(undefined)).toBe(false);
      expect(isDefined(null)).toBe(false);
    });
  });

  describe('isString', () => {
    it('should return true for strings', () => {
      expect(isString('')).toBe(true);
      expect(isString('hello')).toBe(true);
    });

    it('should return false for non-strings', () => {
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
    });
  });

  describe('isNumber', () => {
    it('should return true for valid numbers', () => {
      expect(isNumber(0)).toBe(true);
      expect(isNumber(123)).toBe(true);
      expect(isNumber(-456)).toBe(true);
      expect(isNumber(3.14)).toBe(true);
    });

    it('should return false for NaN and non-numbers', () => {
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber('123')).toBe(false);
      expect(isNumber(null)).toBe(false);
    });
  });

  describe('isInteger', () => {
    it('should return true for integers', () => {
      expect(isInteger(0)).toBe(true);
      expect(isInteger(123)).toBe(true);
      expect(isInteger(-456)).toBe(true);
    });

    it('should return false for non-integers', () => {
      expect(isInteger(3.14)).toBe(false);
      expect(isInteger(NaN)).toBe(false);
      expect(isInteger('123')).toBe(false);
    });
  });

  describe('isBoolean', () => {
    it('should return true for booleans', () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
    });

    it('should return false for non-booleans', () => {
      expect(isBoolean(1)).toBe(false);
      expect(isBoolean('true')).toBe(false);
    });
  });

  describe('isArray', () => {
    it('should return true for arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
    });

    it('should return false for non-arrays', () => {
      expect(isArray({})).toBe(false);
      expect(isArray('array')).toBe(false);
    });
  });

  describe('isObject', () => {
    it('should return true for plain objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: 'value' })).toBe(true);
    });

    it('should return false for non-objects', () => {
      expect(isObject(null)).toBe(false);
      expect(isObject([])).toBe(false);
      expect(isObject('object')).toBe(false);
    });
  });

  describe('isFunction', () => {
    it('should return true for functions', () => {
      expect(isFunction(() => {})).toBe(true);
      expect(isFunction(function() {})).toBe(true);
    });

    it('should return false for non-functions', () => {
      expect(isFunction({})).toBe(false);
      expect(isFunction('function')).toBe(false);
    });
  });
});

describe('JSON Utilities', () => {
  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      expect(safeJsonParse('{"key":"value"}', {})).toEqual({ key: 'value' });
      expect(safeJsonParse('[1,2,3]', [])).toEqual([1, 2, 3]);
    });

    it('should return fallback for invalid JSON', () => {
      expect(safeJsonParse('invalid', { default: true })).toEqual({ default: true });
      expect(safeJsonParse('', [])).toEqual([]);
    });
  });

  describe('safeJsonStringify', () => {
    it('should stringify valid values', () => {
      expect(safeJsonStringify({ key: 'value' })).toBe('{"key":"value"}');
      expect(safeJsonStringify([1, 2, 3])).toBe('[1,2,3]');
    });

    it('should return fallback for circular references', () => {
      const circular: any = { a: 1 };
      circular.self = circular;
      expect(safeJsonStringify(circular, 'error')).toBe('error');
    });
  });
});

describe('Object Utilities', () => {
  describe('getNestedValue', () => {
    const obj = {
      user: {
        profile: {
          name: 'John',
          age: 30,
        },
      },
    };

    it('should get nested values', () => {
      expect(getNestedValue(obj, 'user.profile.name')).toBe('John');
      expect(getNestedValue(obj, 'user.profile.age')).toBe(30);
    });

    it('should return default value for missing paths', () => {
      expect(getNestedValue(obj, 'user.missing.path', 'default')).toBe('default');
      expect(getNestedValue(obj, 'nonexistent', undefined)).toBeUndefined();
    });
  });
});

describe('Array Utilities', () => {
  describe('groupBy', () => {
    it('should group items by key', () => {
      const items = [
        { type: 'fruit', name: 'apple' },
        { type: 'fruit', name: 'banana' },
        { type: 'vegetable', name: 'carrot' },
      ];
      const grouped = groupBy(items, item => item.type);
      expect(grouped.fruit).toHaveLength(2);
      expect(grouped.vegetable).toHaveLength(1);
    });
  });

  describe('sortBy', () => {
    it('should sort in ascending order', () => {
      const items = [{ age: 30 }, { age: 20 }, { age: 25 }];
      const sorted = sortBy(items, item => item.age);
      expect(sorted.map(i => i.age)).toEqual([20, 25, 30]);
    });

    it('should sort in descending order', () => {
      const items = [{ age: 30 }, { age: 20 }, { age: 25 }];
      const sorted = sortBy(items, item => item.age, 'desc');
      expect(sorted.map(i => i.age)).toEqual([30, 25, 20]);
    });
  });

  describe('unique', () => {
    it('should remove duplicates from primitive arrays', () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('should remove duplicates using key function', () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 1 }];
      const result = unique(items, item => item.id);
      expect(result).toHaveLength(2);
    });
  });

  describe('chunk', () => {
    it('should split array into chunks', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
      expect(chunk([1, 2, 3, 4, 5, 6], 3)).toEqual([[1, 2, 3], [4, 5, 6]]);
    });
  });

  describe('flattenDeep', () => {
    it('should flatten nested arrays', () => {
      expect(flattenDeep([1, [2, [3, [4]]]])).toEqual([1, 2, 3, 4]);
      expect(flattenDeep([[1, 2], [3, 4], [5]])).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('shuffle', () => {
    it('should shuffle array', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffle(original);
      expect(shuffled).toHaveLength(original.length);
      expect(shuffled.sort()).toEqual(original.sort());
    });
  });

  describe('sample', () => {
    it('should return random samples', () => {
      const array = [1, 2, 3, 4, 5];
      const samples = sample(array, 3);
      expect(samples).toHaveLength(3);
      samples.forEach(s => expect(array).toContain(s));
    });
  });

  describe('first', () => {
    it('should return first element', () => {
      expect(first([1, 2, 3])).toBe(1);
      expect(first([], 'default')).toBe('default');
    });
  });

  describe('last', () => {
    it('should return last element', () => {
      expect(last([1, 2, 3])).toBe(3);
      expect(last([], 'default')).toBe('default');
    });
  });

  describe('arraysEqual', () => {
    it('should compare arrays', () => {
      expect(arraysEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(arraysEqual([1, 2, 3], [1, 2, 4])).toBe(false);
      expect(arraysEqual([1, 2], [1, 2, 3])).toBe(false);
    });
  });

  describe('intersect', () => {
    it('should return intersection', () => {
      expect(intersect([1, 2, 3], [2, 3, 4])).toEqual([2, 3]);
      expect(intersect([1, 2], [3, 4])).toEqual([]);
    });
  });

  describe('union', () => {
    it('should return union', () => {
      expect(union([1, 2], [2, 3])).toEqual([1, 2, 3]);
      expect(union([1, 2], [3, 4])).toEqual([1, 2, 3, 4]);
    });
  });

  describe('difference', () => {
    it('should return difference', () => {
      expect(difference([1, 2, 3], [2, 3, 4])).toEqual([1]);
      expect(difference([1, 2], [3, 4])).toEqual([1, 2]);
    });
  });

  describe('partition', () => {
    it('should partition array', () => {
      const [evens, odds] = partition([1, 2, 3, 4, 5], n => n % 2 === 0);
      expect(evens).toEqual([2, 4]);
      expect(odds).toEqual([1, 3, 5]);
    });
  });

  describe('countBy', () => {
    it('should count by key', () => {
      const items = ['apple', 'banana', 'apple', 'cherry', 'banana', 'apple'];
      const counts = countBy(items, item => item);
      expect(counts.apple).toBe(3);
      expect(counts.banana).toBe(2);
      expect(counts.cherry).toBe(1);
    });
  });
});

describe('Math Utilities', () => {
  describe('sum', () => {
    it('should calculate sum', () => {
      const items = [{ value: 10 }, { value: 20 }, { value: 30 }];
      expect(sum(items, item => item.value)).toBe(60);
    });
  });

  describe('average', () => {
    it('should calculate average', () => {
      const items = [{ value: 10 }, { value: 20 }, { value: 30 }];
      expect(average(items, item => item.value)).toBe(20);
    });

    it('should return 0 for empty array', () => {
      expect(average([], () => 0)).toBe(0);
    });
  });

  describe('min', () => {
    it('should find minimum', () => {
      const items = [{ value: 30 }, { value: 10 }, { value: 20 }];
      expect(min(items, item => item.value)).toBe(10);
    });
  });

  describe('max', () => {
    it('should find maximum', () => {
      const items = [{ value: 30 }, { value: 10 }, { value: 20 }];
      expect(max(items, item => item.value)).toBe(30);
    });
  });

  describe('rangeNumber', () => {
    it('should generate number range', () => {
      expect(rangeNumber(1, 5)).toEqual([1, 2, 3, 4, 5]);
      expect(rangeNumber(0, 10, 2)).toEqual([0, 2, 4, 6, 8, 10]);
    });
  });

  describe('clamp', () => {
    it('should clamp values', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('lerp', () => {
    it('should interpolate linearly', () => {
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(0, 100, 0.25)).toBe(25);
    });
  });

  describe('mapRange', () => {
    it('should map value from one range to another', () => {
      expect(mapRange(5, 0, 10, 0, 100)).toBe(50);
      expect(mapRange(2.5, 0, 10, 0, 100)).toBe(25);
    });
  });
});

describe('Format Utilities', () => {
  describe('formatBytes', () => {
    it('should format bytes', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
    });

    it('should respect decimal places', () => {
      expect(formatBytes(1536, 2)).toBe('1.5 KB');
      expect(formatBytes(1536, 0)).toBe('2 KB');
    });
  });

  describe('parseBytes', () => {
    it('should parse byte strings', () => {
      expect(parseBytes('1 KB')).toBe(1024);
      expect(parseBytes('1 MB')).toBe(1048576);
      expect(parseBytes('1.5 KB')).toBe(1536);
    });

    it('should return 0 for invalid input', () => {
      expect(parseBytes('invalid')).toBe(0);
      expect(parseBytes('1 XB')).toBe(0);
    });
  });
});

describe('Async Utilities', () => {
  describe('sleep', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90);
    });
  });

  describe('retry', () => {
    it('should retry failed operations', async () => {
      let attempts = 0;
      const fn = vi.fn(async () => {
        attempts++;
        if (attempts < 3) throw new Error('Failed');
        return 'success';
      });

      const result = await retry(fn, 3, 10);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const fn = vi.fn(async () => {
        throw new Error('Always fails');
      });

      await expect(retry(fn, 2, 10)).rejects.toThrow('Always fails');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});

describe('ID Generation', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('should include prefix', () => {
      const id = generateId('user_');
      expect(id).toMatch(/^user_/);
    });
  });
});
