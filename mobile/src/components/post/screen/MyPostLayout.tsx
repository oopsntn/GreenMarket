import React from 'react'
import { StyleSheet } from 'react-native'

const MyPostLayout = () => {
    return (
        <div>

        </div>
    )
}

const styles = StyleSheet.create({
    tabContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#fff' },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#eee' },
    activeTab: { borderBottomColor: '#10b981' },
    tabText: { color: '#999', fontWeight: '600' },
    activeTabText: { color: '#10b981' },
    postCard: { marginBottom: 12, padding: 12 },
    postContent: { flexDirection: 'row', alignItems: 'center' },
    imgPlaceholder: { width: 70, height: 70, borderRadius: 10, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    info: { flex: 1, marginLeft: 12 },
    postTitle: { fontWeight: '700', fontSize: 14, marginBottom: 4 },
    postPrice: { color: '#10b981', fontWeight: '800', fontSize: 13, marginBottom: 6 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    statusText: { fontSize: 10, fontWeight: '700', marginLeft: 4 },
    actions: { flexDirection: 'row' },
    actionBtn: { padding: 8, marginLeft: 4 },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginVertical: 20, color: '#999' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalCard: { padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15 },
    modalButtons: { flexDirection: 'row', marginTop: 20 }
})

export default MyPostLayout
