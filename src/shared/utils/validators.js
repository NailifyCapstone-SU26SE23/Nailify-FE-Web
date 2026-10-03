export const validators = {
  email: (value) => /\S+@\S+\.\S+/.test(value ?? ""),
  required: (value) => String(value ?? "").trim().length > 0,
  // phoneNumber: (value) => {
  //   const phone = (value ?? "").trim();

  //   // Bỏ các ký tự không phải số
  //   const normalized = phone.replace(/\D/g, '');

  //   // Kiểm tra độ dài
  //   if (normalized.length !== 10) {
  //     return false;
  //   }

  //   // Kiểm tra bắt đầu bằng 0 (đối với số điện thoại Việt Nam)
  //   if (!normalized.startsWith('0')) {
  //     return false;
  //   }

  //   return true;
  // },
  // password: (value) => {
  //   const password = (value ?? "").trim();

  //   // Kiểm tra độ dài tối thiểu 6 ký tự
  //   if (password.length < 6) {
  //     return false;
  //   }

  //   // Kiểm tra có ít nhất 1 chữ cái
  //   if (!/[a-zA-Z]/.test(password)) {
  //     return false;
  //   }

  //   // Kiểm tra có ít nhất 1 số
  //   if (!/[0-9]/.test(password)) {
  //     return false;
  //   }

  //   // Kiểm tra có ít nhất 1 ký tự đặc biệt
  //   if (!/[!@#$%^&*]/.test(password)) {
  //     return false;
  //   }

  //   // Kiểm tra không có khoảng trắng
  //   if (password.includes(" ")) {
  //     return false;
  //   }

  //   // Kiểm tra độ dài tối đa 50 ký tự
  //   if (password.length > 32) {
  //     return false;
  //   }

  //   // Kiểm tra không chứa ký tự tiếng Việt
  //   if (/[áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]/.test(password)) {
  //     return false;
  //   }

  //   return true;
  // },
};
// export const phoneValidator = (value) => {
//   const phone = (value ?? "").trim();

//   if (phone === "") {
//     return false;
//   }

//   // 10-11 digits, optional leading 0, optional international prefix
//   const normalized = phone.replace(/^\+?84\s?0?/, "").replace(/^0?/, "").replace(/\D/g, "");
//   return normalized.length >= 9 && normalized.length <= 11;
// };

