import { Alert, Platform, AlertButton } from 'react-native';

// Định nghĩa kiểu cho hàm CustomAlert
const CustomAlert = (
    title: string,
    message: string,
    buttons: AlertButton[] = [] // Xác định đây là mảng các AlertButton
) => {
    if (Platform.OS === 'web') {
        const confirmed = window.confirm(`${title}\n\n${message}`);

        if (confirmed && buttons.length > 0) {
            // Lấy nút cuối cùng (thường là nút OK/Xác nhận)
            const confirmButton = buttons[buttons.length - 1];
            if (confirmButton.onPress) confirmButton.onPress();
        } else if (!confirmed && buttons.length > 1) {
            // Nếu bấm Cancel và có nút Hủy (thường là nút đầu tiên)
            const cancelButton = buttons[0];
            if (cancelButton.onPress) cancelButton.onPress();
        }
    } else {
        Alert.alert(title, message, buttons);
    }
};

export default CustomAlert;