import { DatePicker, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import enUS from 'antd/locale/en_US';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import 'dayjs/locale/en';
import { useLanguage } from '../../hooks/useLanguage';
import { PropTypes } from '../../utils/propTypes';

const { RangePicker } = DatePicker;

export function DateRangePicker({ value, onChange, placeholder, format = "DD/MM/YYYY", className, ...props }) {
  const { language, t } = useLanguage();

  // Đổi ngôn ngữ cho dayjs (hiển thị T2, T3... hoặc Mon, Tue...)
  dayjs.locale(language === 'vi' ? 'vi' : 'en');

  // Ngôn ngữ cho component Ant Design
  const locale = language === 'vi' ? viVN : enUS;

  // Placeholder mặc định lấy từ translation nếu có, không thì dùng hardcode
  const fromText = t('common.fromDate') !== 'common.fromDate' ? t('common.fromDate') : (language === 'vi' ? 'Từ ngày' : 'From date');
  const toText = t('common.toDate') !== 'common.toDate' ? t('common.toDate') : (language === 'vi' ? 'Đến ngày' : 'To date');
  const defaultPlaceholder = [fromText, toText];

  return (
    <ConfigProvider locale={locale}>
      <RangePicker
        format={format}
        value={value}
        onChange={onChange}
        placeholder={placeholder || defaultPlaceholder}
        className={`w-full min-w-[260px] ${className || ""}`}
        {...props}
      />
    </ConfigProvider>
  );
}

DateRangePicker.propTypes = {
  value: PropTypes.array,
  onChange: PropTypes.func,
  placeholder: PropTypes.array,
  format: PropTypes.string,
};

export default DateRangePicker;
