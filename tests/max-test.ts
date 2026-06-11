// @ts-ignore
import { describe, expect, it } from 'vitest';
import { max } from './max.js';

describe('testing max fuction', () => {
  it("Doit renvoyer le deuxieme argument s'il est plus grand", () => {
    let a = 2,
      b = 1,
      resultatAttendu = a;

    let result = max(a, b);

    expect(result).toBe(resultatAttendu);
  });

  it("Doit renvoyer le deuxieme argument s'il est plus grand", () => {
    let a = 2;
    let b = 2;
    let resultatAttendu = a | b;

    let result = max(a, b);

    expect(result).toBe(resultatAttendu);
  });
});
