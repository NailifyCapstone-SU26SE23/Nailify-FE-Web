const createValidator = () => {
  const validator = () => null;
  validator.isRequired = validator;
  return validator;
};

export const PropTypes = {
  arrayOf: () => createValidator(),
  bool: createValidator(),
  elementType: createValidator(),
  func: createValidator(),
  node: createValidator(),
  number: createValidator(),
  oneOf: () => createValidator(),
  oneOfType: () => createValidator(),
  shape: () => createValidator(),
  string: createValidator(),
};
