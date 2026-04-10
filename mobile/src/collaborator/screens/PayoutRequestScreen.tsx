import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    SafeAreaView,
} from 'react-native';
import { 
    ArrowLeft, 
    CircleDollarSign, 
    Banknote, 
    Landmark,
    CheckCircle2,
    Info
} from 'lucide-react-native';
import { CollaboratorService } from '../services/collaboratorService';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const MIN_PAYOUT_AMOUNT = 500000;

const PayoutRequestScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { balance } = route.params;

    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState<'bank' | 'momo' | 'vnpay'>('bank');
    const [note, setNote] = useState('');

    const handleSubmit = async () => {
        const payoutAmount = Number(amount);

        if (!payoutAmount || payoutAmount <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount.');
            return;
        }

        if (payoutAmount < MIN_PAYOUT_AMOUNT) {
            Alert.alert(
                'Minimum Payout', 
                `The minimum amount for a payout is ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(MIN_PAYOUT_AMOUNT)}.`
            );
            return;
        }

        if (payoutAmount > balance) {
            Alert.alert('Insufficient Balance', 'You cannot withdraw more than your current balance.');
            return;
        }

        setLoading(true);
        try {
            await CollaboratorService.createPayoutRequest({
                amount: payoutAmount,
                method: method.toUpperCase(),
                note
            });
            
            Alert.alert(
                'Success', 
                'Your payout request has been submitted and is pending approval.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error: any) {
            console.error('Payout error:', error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to create payout request.');
        } finally {
            setLoading(false);
        }
    };

    const MethodBtn = ({ label, value, icon: Icon }: any) => (
        <TouchableOpacity 
            style={[styles.methodBtn, method === value && styles.activeMethod]}
            onPress={() => setMethod(value)}
        >
            <Icon color={method === value ? '#16A34A' : '#94A3B8'} size={24} />
            <Text style={[styles.methodText, method === value && styles.activeMethodText]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <ArrowLeft color="#1E293B" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Payout Request</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.balanceBox}>
                    <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
                    <Text style={styles.balanceValue}>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(balance)}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Withdraw Amount</Text>
                    <View style={styles.inputContainer}>
                        <CircleDollarSign color="#16A34A" size={24} />
                        <TextInput
                            style={styles.amountInput}
                            placeholder="0"
                            placeholderTextColor="#94A3B8"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />
                        <Text style={styles.currencySuffix}>VND</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Info size={14} color="#64748B" />
                        <Text style={styles.infoText}>Min: 500,000 VND</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payout Method</Text>
                    <View style={styles.methodGrid}>
                        <MethodBtn label="Bank Trans" value="bank" icon={Landmark} />
                        <MethodBtn label="Momo" value="momo" icon={Banknote} />
                        <MethodBtn label="VNPay" value="vnpay" icon={CheckCircle2} />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Details / Note</Text>
                    <TextInput
                        style={styles.noteInput}
                        placeholder="Enter your bank account number, bank name, or Momo phone number..."
                        placeholderTextColor="#94A3B8"
                        multiline
                        numberOfLines={3}
                        value={note}
                        onChangeText={setNote}
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.submitBtn, loading && styles.disabledBtn]} 
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.submitBtnText}>Submit Request</Text>
                    )}
                </TouchableOpacity>

                <Text style={styles.disclaimer}>
                    Payout requests are typically processed within 24-48 business hours. 
                    Approval is subject to verifying completed work.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'white',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
    },
    backBtn: {
        padding: 8,
    },
    scrollContent: {
        padding: 24,
    },
    balanceBox: {
        backgroundColor: '#111827',
        padding: 24,
        borderRadius: 24,
        marginBottom: 32,
    },
    balanceLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 8,
    },
    balanceValue: {
        fontSize: 28,
        fontWeight: '800',
        color: 'white',
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 60,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    amountInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },
    currencySuffix: {
        fontSize: 16,
        fontWeight: '700',
        color: '#64748B',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        paddingLeft: 4,
    },
    infoText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    methodGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    methodBtn: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    activeMethod: {
        borderColor: '#16A34A',
        backgroundColor: '#F0FDF4',
    },
    methodText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
    },
    activeMethodText: {
        color: '#16A34A',
    },
    noteInput: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        height: 100,
        fontSize: 15,
        color: '#1E293B',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        textAlignVertical: 'top',
    },
    submitBtn: {
        backgroundColor: '#16A34A',
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 4,
        marginTop: 16,
    },
    disabledBtn: {
        opacity: 0.6,
    },
    submitBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },
    disclaimer: {
        textAlign: 'center',
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 24,
        lineHeight: 18,
    }
});

export default PayoutRequestScreen;
