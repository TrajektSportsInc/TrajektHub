export class ArrayHelper {
  static equals = <T>(a: T[], b: T[]): boolean => {
    if (a === b) {
      // same pointer
      return true;
    }

    if (a.length !== b.length) {
      // diff length
      return false;
    }

    // pairwise pointer
    return a.every((v, i) => v === b[i]);
  };

  // checks whether the first elements of the longer array are the same as the elements of the shorter array
  static startsWith = <T>(a: T[], b: T[]): boolean => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }

    return true;
  };

  static groupBy = <T>(items: T[], key: string): { [key: string]: T[] } => {
    const output: { [key: string]: T[] } = {};

    items.forEach((m: any) => {
      const safeKey = m[key] ?? '';

      if (!output[safeKey]) {
        output[safeKey] = [];
      }

      output[safeKey].push(m);
    });

    return output;
  };

  /** from https://www.devextent.com/split-typescript-array-into-chunks/ */
  static chunkArray = <T>(items: T[], chunkSize: number) =>
    items.reduce((chunks: T[][], item: T, index) => {
      const chunk = Math.floor(index / chunkSize);
      chunks[chunk] = ([] as T[]).concat(chunks[chunk] || [], item);
      return chunks;
    }, []);

  /** returns an array of unique and non-empty values, filtering out unwanted values according to omit parameter */
  static unique = <T>(
    values: T[],
    omit: any[] = [undefined, null, '']
  ): T[] => {
    const output = Array.from(new Set(values));

    if (!omit) {
      return output;
    }

    return output.filter((m) => !omit.includes(m));
  };

  static countIntersection = <T>(arrA: T[], arrB: T[]): number => {
    const shorterA = arrA.length <= arrB.length;

    return ArrayHelper.getIntersection(
      shorterA ? arrA : arrB,
      shorterA ? arrB : arrA
    ).length;
  };

  // returns true if arrA includes any member of arrB
  static hasIntersection = <T>(arrA: T[], arrB: T[]): boolean => {
    for (const vB of arrB) {
      if (arrA.includes(vB)) {
        return true;
      }
    }

    return false;
  };

  static hasSubstringIntersection = (
    arrA: string[],
    arrB: string[]
  ): boolean => {
    for (const vB of arrB) {
      if (arrA.findIndex((vA) => vA.includes(vB)) !== -1) {
        return true;
      }
    }

    return false;
  };

  static getIntersection = <T>(arrA: T[], arrB: T[]) => {
    return arrA.filter((a) => arrB.findIndex((b) => b === a) !== -1);
  };

  static isArray = (data: any): boolean => {
    return Object.prototype.toString.call(data) === '[object Array]';
  };

  static getBreakpoints = (total: number, step: number): number[] => {
    const breakpoints: number[] = [];

    for (let skip = 0; skip < total; skip += step) {
      breakpoints.push(skip);
    }

    return breakpoints;
  };

  static getRandomMember = <T>(value: T[]) => {
    const index = Math.round(Math.random() * 10 * value.length) % value.length;
    return value[index];
  };
}
