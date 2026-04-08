import React from 'react'
import { StyleSheet, TextStyle, TouchableOpacity, View, ViewStyle, Text, ActivityIndicator, StyleProp } from 'react-native';

interface ButtonProps {
    children: React.ReactNode;
    variant?: 'primary' | 'outline';
    onPress?: () => void;
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    size?: 'small' | 'medium' | 'large';
    icon?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}
const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    onPress,
    disabled = false,
    loading = false,
    fullWidth = false,
    size = 'medium',
    icon = null,
    style,
    textStyle,
}) => {
    const isDisabled = disabled || loading;
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.7}
            style={[
                styles.btn,
                styles[variant as keyof typeof styles] as ViewStyle,
                styles[size as keyof typeof styles] as ViewStyle,
                fullWidth && styles.btnFull,
                disabled && styles.btnDisabled,
                style,
                
            ]}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={variant === 'primary' ? '#fff' : '#52c41a'}
                />
            ) : (
                <>
                    {icon && <View style={styles.btnIcon}>{icon}</View>}
                    <Text style={[
                        styles.btnText,
                        styles[`text${variant.charAt(0).toUpperCase() + variant.slice(1)}` as keyof typeof styles],
                        styles[`fontSize${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof styles],
                    ]}>
                        {children}
                    </Text>
                </>
            )
            }

        </TouchableOpacity >

    )
}

const styles = StyleSheet.create({
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 9,
    } as ViewStyle,

    //Variants
    primary: {
        backgroundColor: '#52c41a',
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#52c41a',
    },

    //Sizes
    small: {
        height: 26,
        paddingHorizontal: 14,
    },
    medium: {
        height: 44,
        paddingHorizontal: 18,
    },
    large: {
        height: 52,
        paddingHorizontal: 22,
    },

    //Full Width
    btnFull: {
        width: '100%',
    },
    //text Styles
    btnText: {
        fontWeight: '600',
    } as TextStyle,
    textPrimary: {
        color: '#fff',
    },
    textOutline: {
        color: '#52c41a',
    },

    //Font Sizes
    fontSizeSmall: { fontSize: 13 },
    fontSizeMedium: { fontSize: 14 },
    fontSizeLarge: { fontSize: 16 },

    // Icon & States
    btnIcon: {
        marginRight: 8,
    },
    btnDisabled: {
        opacity: 0.6,
    },
})

export default Button
