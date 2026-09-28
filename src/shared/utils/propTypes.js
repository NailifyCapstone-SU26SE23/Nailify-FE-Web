const createValidator = () => {
  const validator = () => null;
  validator.isRequired = validator;
  return validator;
};

export const PropTypes = {
  any: createValidator(),
  array: createValidator(),
  arrayOf: () => createValidator(),
  bool: createValidator(),
  element: createValidator(),
  elementType: createValidator(),
  func: createValidator(),
  node: createValidator(),
  number: createValidator(),
  object: createValidator(),
  objectOf: () => createValidator(),
  oneOf: () => createValidator(),
  oneOfType: () => createValidator(),
  shape: () => createValidator(),
  string: createValidator(),
  symbol: createValidator(),
};
