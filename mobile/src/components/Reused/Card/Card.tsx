import React from 'react'
import { Platform, StyleSheet, TouchableOpacity, View, ViewStyle, StyleProp } from 'react-native';

interface CardProps {
    children: React.ReactNode;
    onClick?: () => void;
    hover?: boolean;
    padding?: 'small' | 'medium' | 'large';
    shadow?: boolean;
    style?: StyleProp<ViewStyle>;
}
const Card: React.FC<CardProps> = ({
    children,
    onClick,
    hover = true,
    padding = 'medium',
    shadow = true,
    style,
}) => {
    const Container = onClick ? TouchableOpacity : View;
    return (
        <Container
            onPress={onClick}
            activeOpacity={hover ? 0.8 : 1}
            style={[
                styles.card,
                styles[`padding${padding.charAt(0).toUpperCase() + padding.slice(1)}` as keyof typeof styles],
                shadow && styles.cardShadow,
                style,
            ]}
        >
            {children}
        </Container >
    )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fcfcfc',
        borderRadius: 12
    },
    paddingSmall: {
        padding: 10,
    },
    paddingMedium: {
        padding: 14,
    },
    paddingLarge: {
        padding: 20,
    },
    cardShadow: {
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            }
        })
    }
})

export default Card
