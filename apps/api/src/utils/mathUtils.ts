export const divideAndGetFixedNumber = (a: number, b: number): number => {
  const factor = Math.pow(10, 2);
  return Math.floor((a / b) * factor) / factor;
};

export const multiplyAndGetFixedNumber = (a: number, b: number): number => {
  const factor = Math.pow(10, 2);
  return Math.floor(a * b * factor) / factor;
};

export const mathOperationAndGetFixedNumber = (
  a: number,
  b: number,
  op: (aa: number, bb: number) => number
): number => {
  const factor = Math.pow(10, 2);
  return Math.floor(op(a, b) * factor) / factor;
};
