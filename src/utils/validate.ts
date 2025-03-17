export default class Validation {
  // kiểm tra tên người dùng
  public static validateUsername(value: string) {
    value = value.trim()
    return value.length > 0 && value.length <= 50
  }
  // kiểm tra mật khẩu
  public static validatePassword(value: string) {
    const reg = /^[a-zA-Z0-9_-]{6,18}$/
    return reg.test(value)
  }
  // kiểm tra email
  public static validateEmail(value: string) {
    const reg = /^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_-])+(.[a-zA-Z0-9_-])+/
    return reg.test(value)
  }
  // kiểm tra số điện thoại
  public static validatePhone(value: string) {
    const reg = /^1[3456789]\d{9}$/
    return reg.test(value)
  }
  // kiểm tra mã xác thực
  public static validateCode(value: string) {
    const reg = /^[a-zA-Z0-9]{6}$/
    return reg.test(value)
  }
}