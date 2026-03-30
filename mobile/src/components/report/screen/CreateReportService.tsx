import React from 'react'
import MobileLayout from '../../Reused/MobileLayout/MobileLayout'
import { ScrollView, StyleSheet } from 'react-native'

const CreateReportService = () => {

    return (
        <MobileLayout>
            <ScrollView>

            </ScrollView>
        </MobileLayout>
    )
}

const styles = StyleSheet.create({
    container: { padding: 16 },
    headerInfo: {
        flexDirection: 'row',
        backgroundColor: '#fee2e2',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20
    },
    headerText: {
        fontSize: 13,
        color: '#991b1b',
        marginLeft: 8,
        flexShrink: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginVertical: 15,
        color: '#333',
    },
    reasonItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    activeReason: {
        borderColor: '#ef4444',
        backgroundColor: '#fff1f2'
    },
    reasonText: {
        fontSize: 14,
        color: '#444',
    },
    activeReasonText: {
        color: '#ef4444',
        fontWeight: 'bold',
    },
    radio: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: '#ccc',
    },
    radioActive: {
        borderColor: '#ef4444',
        backgroundColor: '#ef4444',
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 30,
    },
    submitBtn: {
        backgroundColor: '#ef4444',
        borderRadius: 12,
    }
})

export default CreateReportService
