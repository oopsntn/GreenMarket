import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { X } from 'lucide-react-native';

const VIETNAM_PROVINCES = [
  'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu',
  'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước',
  'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông',
  'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
  'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình',
  'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu',
  'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định',
  'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên',
  'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị',
  'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
  'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang',
  'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái',
];

interface FilterDrawerProps {
  visible: boolean;
  categories: any[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  minPrice: string;
  onMinPriceChange: (value: string) => void;
  maxPrice: string;
  onMaxPriceChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
}

const FilterDrawer: React.FC<FilterDrawerProps> = ({
  visible,
  categories,
  selectedCategoryId,
  onSelectCategory,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  location,
  onLocationChange,
  onApply,
  onClear,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.overlay}>
          {/* Semi-transparent background */}
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={onClose}
          />

          {/* Drawer Content */}
          <View style={styles.drawer}>
            {/* Header */}
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Bộ lọc</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.drawerContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Category Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Danh mục</Text>
                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    selectedCategoryId === '' && styles.categoryButtonActive,
                  ]}
                  onPress={() => onSelectCategory('')}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      selectedCategoryId === '' && styles.categoryButtonTextActive,
                    ]}
                  >
                    Tất cả cây
                  </Text>
                </TouchableOpacity>

                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.categoryId}
                    style={[
                      styles.categoryButton,
                      selectedCategoryId === cat.categoryId.toString() &&
                      styles.categoryButtonActive,
                    ]}
                    onPress={() => onSelectCategory(cat.categoryId.toString())}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        selectedCategoryId === cat.categoryId.toString() &&
                        styles.categoryButtonTextActive,
                      ]}
                    >
                      {cat.categoryTitle}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Price Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Khoảng giá (VND)</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Giá thấp nhất"
                  value={minPrice}
                  onChangeText={onMinPriceChange}
                  keyboardType="number-pad"
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={[styles.priceInput, { marginTop: 10 }]}
                  placeholder="Giá cao nhất"
                  value={maxPrice}
                  onChangeText={onMaxPriceChange}
                  keyboardType="number-pad"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Location Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Vị trí</Text>
                <ScrollView
                  style={styles.locationList}
                  showsVerticalScrollIndicator={false}
                >
                  <TouchableOpacity
                    style={[
                      styles.locationButton,
                      location === '' && styles.locationButtonActive,
                    ]}
                    onPress={() => onLocationChange('')}
                  >
                    <Text
                      style={[
                        styles.locationButtonText,
                        location === '' && styles.locationButtonTextActive,
                      ]}
                    >
                      Toàn quốc
                    </Text>
                  </TouchableOpacity>

                  {VIETNAM_PROVINCES.map((prov) => (
                    <TouchableOpacity
                      key={prov}
                      style={[
                        styles.locationButton,
                        location === prov && styles.locationButtonActive,
                      ]}
                      onPress={() => onLocationChange(prov)}
                    >
                      <Text
                        style={[
                          styles.locationButtonText,
                          location === prov && styles.locationButtonTextActive,
                        ]}
                      >
                        {prov}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.drawerFooter}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={onClear}
              >
                <Text style={styles.clearButtonText}>Xóa</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={onApply}
              >
                <Text style={styles.applyButtonText}>Lọc cây</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    width: Dimensions.get('window').width * 0.75,
    backgroundColor: '#fff',
    flexDirection: 'column',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  drawerContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  locationList: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 8,
  },
  locationButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationButtonActive: {
    backgroundColor: '#f0fdf4',
  },
  locationButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  locationButtonTextActive: {
    color: '#10b981',
  },
  drawerFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});

export default FilterDrawer;
