import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions, 
  SafeAreaView, 
  Modal, 
  Button,
  ScrollView,
  Image
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// --- EKRANY DODATKOWE (MOCKUPY) ---

// 1. Ekran Profilu
const ProfileScreen = () => (
  <View style={styles.screenContainer}>
    <View style={styles.profileHeader}>
      <View style={styles.avatarCircle}>
        <Ionicons name="person" size={50} color="#FFF" />
      </View>
      <Text style={styles.profileName}>Łowca Roślin</Text>
      <Text style={styles.profileLevel}>Poziom 5: Ekspert</Text>
    </View>

    <View style={styles.statsRow}>
      <View style={styles.statBox}>
        <Text style={styles.statValue}>1250</Text>
        <Text style={styles.statLabel}>Punkty</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={styles.statValue}>42</Text>
        <Text style={styles.statLabel}>Zgłoszenia</Text>
      </View>
    </View>

    <Text style={styles.sectionTitle}>Ostatnie aktywności</Text>
    <ScrollView style={styles.activityList}>
      <View style={styles.activityItem}>
        <Ionicons name="checkmark-circle" size={24} color="#32CD32" />
        <View style={{marginLeft: 10}}>
          <Text style={styles.actTitle}>Zgłoszono Barszcz Sosn.</Text>
          <Text style={styles.actDate}>Dzisiaj, 14:30 +50 pkt</Text>
        </View>
      </View>
      <View style={styles.activityItem}>
        <Ionicons name="checkmark-circle" size={24} color="#32CD32" />
        <View style={{marginLeft: 10}}>
          <Text style={styles.actTitle}>Zgłoszono Nawłoć</Text>
          <Text style={styles.actDate}>Wczoraj, 09:15 +20 pkt</Text>
        </View>
      </View>
    </ScrollView>
  </View>
);

// 2. Ekran Nagród
const RewardsScreen = () => (
  <ScrollView style={styles.screenContainer}>
    <Text style={styles.screenTitle}>Nagrody</Text>
    <Text style={styles.subTitle}>Wymień punkty na zniżki!</Text>
    
    <View style={styles.couponCard}>
      <View style={styles.couponLeft}>
        <FontAwesome5 name="coffee" size={30} color="#8B4513" />
      </View>
      <View style={styles.couponRight}>
        <Text style={styles.couponTitle}>Darmowa Kawa</Text>
        <Text style={styles.couponCost}>500 pkt</Text>
        <TouchableOpacity style={styles.redeemButton}>
          <Text style={styles.redeemText}>Odbierz</Text>
        </TouchableOpacity>
      </View>
    </View>

    <View style={styles.couponCard}>
      <View style={styles.couponLeft}>
        <FontAwesome5 name="bus" size={30} color="#000" />
      </View>
      <View style={styles.couponRight}>
        <Text style={styles.couponTitle}>Bilet 24h MPK</Text>
        <Text style={styles.couponCost}>1000 pkt</Text>
        <TouchableOpacity style={styles.redeemButton}>
          <Text style={styles.redeemText}>Odbierz</Text>
        </TouchableOpacity>
      </View>
    </View>
  </ScrollView>
);

// 3. Ekran Listy Roślin (Baza wiedzy)
const PlantsScreen = () => (
  <ScrollView style={styles.screenContainer}>
    <Text style={styles.screenTitle}>Baza Inwazyjna</Text>
    
    <View style={styles.plantCard}>
      <Text style={styles.plantCardTitle}>Barszcz Sosnowskiego</Text>
      <Text style={styles.plantCardDesc}>Bardzo niebezpieczna roślina parząca. Unikaj kontaktu ze skórą.</Text>
      <View style={styles.dangerBadge}><Text style={styles.dangerText}>WYSOKIE RYZYKO</Text></View>
    </View>

    <View style={styles.plantCard}>
      <Text style={styles.plantCardTitle}>Nawłoć Kanadyjska</Text>
      <Text style={styles.plantCardDesc}>Wypiera rodzime gatunki roślin. Często spotykana na łąkach.</Text>
      <View style={[styles.dangerBadge, {backgroundColor:'#FFA500'}]}><Text style={styles.dangerText}>ŚREDNIE RYZYKO</Text></View>
    </View>
  </ScrollView>
);


// --- GŁÓWNY KOMPONENT ---

export default function Index() {
  const [permission, requestPermission] = useCameraPermissions();
  
  // NOWE: Stan do zarządzania zakładkami
  const [activeTab, setActiveTab] = useState<'camera' | 'plants' | 'rewards' | 'profile'>('camera');
  
  const [isScanning, setIsScanning] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [scanResult, setScanResult] = useState<'invasive' | 'safe' | null>(null);

  if (!permission) return <View style={styles.container} />;
  
  if (!permission.granted) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: 'white', marginBottom: 20 }}>Potrzebny dostęp do kamery</Text>
        <Button onPress={requestPermission} title="Przyznaj dostęp" color="#32CD32" />
      </View>
    );
  }

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const randomResult = Math.random() > 0.4 ? 'invasive' : 'safe';
      setScanResult(randomResult);
      setModalVisible(true);
    }, 2000);
  };

  const closeResult = () => {
    setModalVisible(false);
    setScanResult(null);
  };

  // Funkcja renderująca odpowiedni ekran
  const renderContent = () => {
    switch (activeTab) {
      case 'camera':
        return (
          <CameraView style={styles.camera} facing="back">
            <SafeAreaView style={styles.uiLayer}>
              <View style={styles.topOverlay}>
                <View style={styles.badge}>
                  <Ionicons name="scan-outline" size={16} color="white" />
                  <Text style={styles.topText}>Szukam inwazyjnych roślin...</Text>
                </View>
              </View>
              <View style={styles.centerFocus}>
                {isScanning ? (
                  <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#32CD32" />
                    <Text style={styles.scanningText}>AI Analizuje...</Text>
                  </View>
                ) : (
                  <View style={styles.focusFrame} />
                )}
              </View>
              <View style={styles.controlsContainer}>
                <TouchableOpacity 
                  style={[styles.scanButton, isScanning && { backgroundColor: '#555' }]} 
                  onPress={handleScan} 
                  disabled={isScanning}
                >
                  <Text style={styles.scanButtonText}>
                    {isScanning ? 'SKANOWANIE...' : 'SKANUJ'}
                  </Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </CameraView>
        );
      case 'plants':
        return <PlantsScreen />;
      case 'rewards':
        return <RewardsScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      
      {/* 1. Wyświetlanie treści w zależności od zakładki */}
      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>

      {/* 2. Dolny Pasek Nawigacji */}
      <View style={styles.bottomBar}>
        
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('camera')}>
          <Ionicons name="camera" size={28} color={activeTab === 'camera' ? '#32CD32' : '#ccc'} />
          {activeTab === 'camera' && <View style={styles.activeDot} />}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('plants')}>
          <Ionicons name="leaf" size={28} color={activeTab === 'plants' ? '#32CD32' : '#ccc'} />
          {activeTab === 'plants' && <View style={styles.activeDot} />}
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('rewards')}>
          <Ionicons name="trophy" size={28} color={activeTab === 'rewards' ? '#32CD32' : '#ccc'} />
          {activeTab === 'rewards' && <View style={styles.activeDot} />}
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('profile')}>
          <Ionicons name="person" size={28} color={activeTab === 'profile' ? '#32CD32' : '#ccc'} />
          {activeTab === 'profile' && <View style={styles.activeDot} />}
        </TouchableOpacity>

      </View>

      {/* Modal Wyniku (tylko na ekranie kamery lub globalnie) */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={closeResult}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {scanResult === 'invasive' ? (
              <>
                <Ionicons name="warning" size={60} color="#FF4500" />
                <Text style={styles.modalTitle}>Wykryto zagrożenie!</Text>
                <Text style={styles.plantName}>Barszcz Sosnowskiego</Text>
                <Text style={styles.desc}>Zachowaj ostrożność. Roślina parząca.</Text>
                <View style={styles.pointsBadge}><Text style={styles.pointsText}>+50 PKT</Text></View>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={60} color="#32CD32" />
                <Text style={styles.modalTitle}>Roślina bezpieczna</Text>
                <Text style={styles.desc}>To zwykła roślinność łąkowa.</Text>
              </>
            )}
            <TouchableOpacity onPress={closeResult} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>WRÓĆ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  camera: { flex: 1 },
  uiLayer: { flex: 1, justifyContent: 'space-between' },
  
  // Style Kamery
  topOverlay: { alignItems: 'center', marginTop: 50 },
  badge: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
  topText: { color: 'white', marginLeft: 8, fontWeight: '600' },
  centerFocus: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  focusFrame: { width: 280, height: 350, borderWidth: 2, borderColor: 'white', borderRadius: 20, borderStyle: 'dashed' },
  loaderContainer: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 20, borderRadius: 15, alignItems: 'center' },
  scanningText: { color: 'white', marginTop: 10, fontWeight: 'bold' },
  controlsContainer: { alignItems: 'center', marginBottom: 20 },
  scanButton: { backgroundColor: '#32CD32', width: width * 0.8, padding: 18, borderRadius: 30, alignItems: 'center', elevation: 5 },
  scanButtonText: { color: 'white', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },
  
  // Style Dolnego Paska
  bottomBar: { height: 85, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#eee', elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', height: '100%', width: 60 },
  activeDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#32CD32', marginTop: 4 },

  // Style Modala
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: 'white', padding: 25, borderRadius: 25, alignItems: 'center', elevation: 10 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 15, color: '#333' },
  plantName: { fontSize: 20, color: '#FF4500', fontWeight: 'bold', marginVertical: 5 },
  desc: { textAlign: 'center', color: '#666', marginVertical: 10, fontSize: 16 },
  pointsBadge: { backgroundColor: '#FFD700', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 10, marginTop: 5 },
  pointsText: { fontWeight: 'bold', color: '#B8860B' },
  closeButton: { marginTop: 25, backgroundColor: '#333', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 20 },
  closeButtonText: { color: 'white', fontWeight: 'bold' },

  // --- STYLE NOWYCH EKRANÓW ---
  screenContainer: { flex: 1, padding: 20, paddingTop: 60 },
  screenTitle: { fontSize: 32, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  subTitle: { fontSize: 16, color: '#666', marginBottom: 20 },
  
  // Profil
  profileHeader: { alignItems: 'center', marginBottom: 30 },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#32CD32', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  profileName: { fontSize: 24, fontWeight: 'bold' },
  profileLevel: { color: '#32CD32', fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30, backgroundColor: 'white', padding: 20, borderRadius: 15, elevation: 2 },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  statLabel: { color: '#888' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  activityList: { flex: 1 },
  activityItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10 },
  actTitle: { fontWeight: 'bold', fontSize: 16 },
  actDate: { color: '#888', fontSize: 12 },

  // Nagrody
  couponCard: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 15, padding: 15, marginBottom: 15, elevation: 2, alignItems: 'center' },
  couponLeft: { width: 60, alignItems: 'center' },
  couponRight: { flex: 1, paddingLeft: 10 },
  couponTitle: { fontSize: 18, fontWeight: 'bold' },
  couponCost: { color: '#32CD32', fontWeight: 'bold', marginBottom: 5 },
  redeemButton: { backgroundColor: '#333', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, alignSelf: 'flex-start' },
  redeemText: { color: 'white', fontSize: 12, fontWeight: 'bold' },

  // Rośliny
  plantCard: { backgroundColor: 'white', padding: 20, borderRadius: 15, marginBottom: 15, elevation: 2 },
  plantCardTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  plantCardDesc: { color: '#555', marginBottom: 10 },
  dangerBadge: { backgroundColor: '#FF4500', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  dangerText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
});