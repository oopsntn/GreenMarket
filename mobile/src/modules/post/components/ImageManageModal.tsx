import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ArrowUpDown, Camera, Trash } from 'lucide-react-native'

const ImageManageModal: React.FC = () => {
    return (
        <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
                Quản lý hình ảnh
            </Text>

            <View style={styles.imageGrid}>

                <View style={styles.imageBox}>
                    <Text style={styles.imagePlaceholder}>IMG</Text>
                </View>

                <View style={[styles.imageBox, styles.imageBoxActive]}>
                    <Text style={styles.thumbnailLabel}>Thumbnail</Text>
                </View>

                <View style={styles.imageBox}>
                    <Text style={styles.imagePlaceholder}>IMG</Text>
                </View>
            </View>

            <View style={styles.actionRowModal}>
                <TouchableOpacity style={styles.modalActionItem}>
                    <Camera size={20} color="#2e7d32" />
                    <Text style={styles.modalActionText}>Upload</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalActionItem}>
                    <Trash size={20} color="#c62828" />
                    <Text style={styles.modalActionTextDanger}>Xóa</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalActionItem}>
                    <ArrowUpDown size={20} color="#666" />
                    <Text style={styles.modalActionText}>Sắp xếp</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    modalContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        color: '#333'
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20
    },
    imageBox: {
        width: '31%',
        height: 80,
        backgroundColor: '#f1f3f4',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },
    imageBoxActive: {
        borderWidth: 2,
        borderColor: '#2e7d32',
        backgroundColor: '#e8f5e9'
    },
    imagePlaceholder: {
        fontSize: 12,
        color: '#999'
    },
    thumbnailLabel: {
        fontSize: 10,
        color: '#2e7d32',
        fontWeight: 'bold'
    },
    actionRowModal: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 10
    },
    modalActionItem: {
        alignItems: 'center',
        gap: 4
    },
    modalActionText: {
        fontSize: 12,
        color: '#2e7d32',
        fontWeight: '500'
    },
    modalActionTextDanger: {
        fontSize: 12,
        color: '#c62828',
        fontWeight: '500'
    }
})

export default ImageManageModal
