import React, { useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, KeyboardTypeOptions, StyleProp,
    ViewStyle
} from 'react-native';

interface InputProps {
    label?: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    error?: string;
    icon?: React.ReactNode;
    disabled?: boolean;
    required?: boolean;
    type?: 'text' | KeyboardTypeOptions; // Thêm type để xác định kiểu bàn phím
    secureTextEntry?: boolean; // Thêm cho trường hợp nhập password
    multiline?: boolean;
    numberOfLines?: number;
    style?: StyleProp<ViewStyle>;
}

const Input: React.FC<InputProps> = ({
    label,
    value,
    onChangeText, // Trong RN dùng onChangeText thay vì onChange
    placeholder,
    type = "default", // RN dùng keyboardType: 'default', 'numeric', 'email-address'...
    error = "",
    icon = null,
    disabled = false,
    required = false,
    secureTextEntry = false, // Thêm cho trường hợp nhập password
    multiline,
    numberOfLines,
    style,
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const keyboardType = (type === 'text' ? 'default' : type) as KeyboardTypeOptions
    return (
        <View style={[styles.inputGroup, style]}>
            {/* Label Section */}
            {label && (
                <Text style={styles.inputLabel}>
                    {label}
                    {required && <Text style={styles.inputRequired}> *</Text>}
                </Text>
            )}

            {/* Input Wrapper */}
            <View style={[
                styles.inputWrapper,
                isFocused && styles.inputFocused,
                error ? styles.inputErrorBorder : null,
                disabled && styles.inputDisabled
            ]}>

                {/* Icon Section */}
                {icon && <View style={styles.inputIcon}>{icon}</View>}

                <TextInput
                    style={[
                        styles.input,
                        icon ? styles.inputWithIcon : null,
                        multiline ? { height: numberOfLines ? (numberOfLines * 24) : 100, textAlignVertical: 'top', paddingTop: 12 } : null // Thêm style cho multiline
                    ]}
                    value={value}
                    placeholder={placeholder}
                    placeholderTextColor="#999"
                    onChangeText={onChangeText}
                    editable={!disabled}
                    keyboardType={keyboardType}
                    secureTextEntry={secureTextEntry}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                />
            </View>

            {/* Error Message */}
            {error ? <Text style={styles.inputErrorText}>{error}</Text> : null}
        </View>
    );
};

const styles = StyleSheet.create({
    inputGroup: {
        flexDirection: 'column',
        marginBottom: 12,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 6,
        color: '#333',
    },
    inputRequired: {
        color: '#ff4d4f', // Giả định var(--danger)
    },
    inputWrapper: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 44,
        borderRadius: 8, // Giả định var(--radius-md)
        borderWidth: 1,
        borderColor: '#d9d9d9', // Giả định var(--border-color)
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        color: '#000',
        minHeight: 44,
    },
    inputFocused: {
        borderColor: '#52c41a', // Giả định var(--green-primary)
    },
    inputErrorBorder: {
        borderColor: '#ff4d4f',
    },
    inputDisabled: {
        backgroundColor: '#f5f5f5',
        borderColor: '#d9d9d9',
    },
    inputWithIcon: {
        paddingLeft: 38,
    },
    inputIcon: {
        position: 'absolute',
        left: 12,
        zIndex: 1,
    },
    inputErrorText: {
        fontSize: 12,
        color: '#ff4d4f',
        marginTop: 4,
    },
});

export default Input;