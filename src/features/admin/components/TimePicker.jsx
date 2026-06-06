import { TimePicker as AntdTimePicker } from "antd";
import dayjs from "dayjs";
import { PropTypes } from "../../../shared/utils/propTypes";

export function TimePicker({
  value,
  onChange,
  placeholder = "Select time",
  format = "HH:mm",
  className,
  ...props
}) {
  const handleChange = (_time, timeString) => {
    onChange?.(timeString);
  };

  const dayjsValue = value ? dayjs(value, format) : null;

  return (
    <AntdTimePicker
      value={dayjsValue?.isValid() ? dayjsValue : null}
      onChange={handleChange}
      placeholder={placeholder}
      format={format}
      className={className}
      size="small"
      {...props}
    />
  );
}

TimePicker.propTypes = {
  className: PropTypes.string,
  format: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  value: PropTypes.string,
};
