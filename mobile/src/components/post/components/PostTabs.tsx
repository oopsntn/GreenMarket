import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

interface PostTabsProps {
  activeTab: 'personal' | 'shop' | 'trash'
  onTabChange: (tab: 'personal' | 'shop' | 'trash') => void
  hasShop: boolean
  styles: any
}

const PostTabs = ({ activeTab, onTabChange, hasShop, styles }: PostTabsProps) => {
  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'personal' && styles.activeTab]}
        onPress={() => onTabChange('personal')}
      >
        <Text style={[styles.tabText, activeTab === 'personal' && styles.activeTabText]}>
          Tin cá nhân
        </Text>
      </TouchableOpacity>

      {hasShop ? (
        <TouchableOpacity
          style={[styles.tab, activeTab === 'shop' && styles.activeTab]}
          onPress={() => onTabChange('shop')}
        >
          <Text style={[styles.tabText, activeTab === 'shop' && styles.activeTabText]}>
            Cửa hàng
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

export default PostTabs
