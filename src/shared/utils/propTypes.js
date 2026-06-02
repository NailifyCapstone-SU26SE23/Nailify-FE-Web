const createValidator = () => {
  const validator = () => null;
  validator.isRequired = validator;
  return validator;
};

export const PropTypes = {
  arrayOf: () => createValidator(),
  bool: createValidator(),
  func: createValidator(),
  node: createValidator(),
  oneOfType: () => createValidator(),
  shape: () => createValidator(),
  string: createValidator(),
};
