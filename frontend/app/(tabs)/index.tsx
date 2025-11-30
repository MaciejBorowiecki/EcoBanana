import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, 
  Dimensions, SafeAreaView, Modal, Button, ScrollView, Alert, Image, FlatList
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { 
  analyzePlant, getPlantsDatabase, getUserPoints,
  ScanResult, PlantKnowledgeEntry 
} from '../../utils/api';

const { width } = Dimensions.get('window');

// --- DANE NA SZTYWNO DLA MVP ---
const USER_NAME = "Janusz"; // Nasz bohater
const USER_LEVEL = "Łowca Inwazji";

// --- NAGRODY ---
const REWARDS = [
  { id: 1, name: "Karta Podarunkowa Roblox 50 PLN", cost: 2000, icon: "gamepad-variant", color: "#000000", lib: "MaterialCommunityIcons" },
  { id: 2, name: "Karta G2A 10 EUR", cost: 1500, icon: "steam", color: "#2d3436", lib: "FontAwesome5" },
  { id: 3, name: "Hot Dog z Żabki", cost: 300, icon: "food-drumstick", color: "#27ae60", lib: "MaterialCommunityIcons" },
  { id: 4, name: "Spotify Premium (1 mc)", cost: 1000, icon: "spotify", color: "#1DB954", lib: "FontAwesome5" },
  { id: 5, name: "Bilet do Kina Helios", cost: 1200, icon: "film", color: "#e74c3c", lib: "FontAwesome5" },
  { id: 6, name: "Zniżka -20% w OBI", cost: 800, icon: "tools", color: "#e67e22", lib: "FontAwesome5" },
];

// --- EKRAN PROFILU ---
const ProfileScreen = ({ points }: { points: number }) => (
  <View style={styles.screenContainer}>
    <View style={styles.profileHeader}>
      <View style={styles.avatarCircle}>
        <Text style={{fontSize: 40, color: 'white'}}>J</Text>
      </View>
      <Text style={styles.profileName}>{USER_NAME}</Text>
      <Text style={styles.profileLevel}>{USER_LEVEL}</Text>
    </View>
    <View style={styles.statsRow}>
      <View style={styles.statBox}>
        <Text style={styles.statValue}>{points}</Text>
        <Text style={styles.statLabel}>Dostępne Punkty</Text>
      </View>
    </View>
    
    <Text style={styles.sectionTitle}>Twoje ostatnie akcje:</Text>
    <View style={styles.activityItem}>
        <Ionicons name="checkmark-circle" size={24} color="#32CD32" />
        <View style={{marginLeft: 10}}>
          <Text style={{fontWeight: 'bold'}}>Zalogowano do systemu</Text>
          <Text style={{color:'#666', fontSize: 12}}>Status: Aktywny</Text>
        </View>
    </View>
  </View>
);

// --- EKRAN NAGRÓD ---
const RewardsScreen = ({ points, onRedeem }: { points: number, onRedeem: (cost: number, name: string) => void }) => (
  <ScrollView style={styles.screenContainer}>
    <Text style={styles.screenTitle}>Nagrody</Text>
    <Text style={styles.subTitle}>Wymieniaj punkty na karty i zniżki!</Text>
    
    {REWARDS.map(reward => (
      <View key={reward.id} style={styles.couponCard}>
        <View style={styles.couponLeft}>
          {/* Obsługa różnych bibliotek ikon */}
          {reward.lib === "FontAwesome5" ? (
             <FontAwesome5 name={reward.icon as any} size={28} color={reward.color} />
          ) : (
             <MaterialCommunityIcons name={reward.icon as any} size={32} color={reward.color} />
          )}
        </View>
        <View style={styles.couponRight}>
          <Text style={styles.couponTitle}>{reward.name}</Text>
          <Text style={styles.couponCost}>{reward.cost} pkt</Text>
          
          <TouchableOpacity 
            style={[styles.redeemButton, points < reward.cost && {backgroundColor: '#ccc'}]}
            disabled={points < reward.cost}
            onPress={() => onRedeem(reward.cost, reward.name)}
          >
            <Text style={styles.redeemText}>
              {points < reward.cost ? 'ZA DROGIE' : 'ODBIERZ'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    ))}
    <View style={{height: 40}} />
  </ScrollView>
);

// --- EKRAN BAZY WIEDZY ---
const PlantsScreen = () => {
  const [plants, setPlants] = useState<PlantKnowledgeEntry[]>([]);
  
  useEffect(() => {
    getPlantsDatabase().then(setPlants);
  }, []);

  return (
    <ScrollView style={styles.screenContainer}>
      <Text style={styles.screenTitle}>Baza Inwazyjna</Text>
      {plants.length === 0 && <ActivityIndicator color="#32CD32" style={{marginTop:20}} />}
      
      {plants.map((plant, index) => (
        <View key={index} style={styles.plantCard}>
          <Text style={styles.plantCardTitle}>{plant.polish_name}</Text>
          <Text style={{fontStyle:'italic', color:'#666'}}>{plant.latin_name}</Text>
          <View style={{flexDirection:'row', justifyContent:'space-between', marginTop: 5}}>
            <Text style={{color: '#FF4500', fontWeight:'bold'}}>{plant.invasiveness}</Text>
            {/* Backend zwraca punkty, mnożymy x10 bo tak jest w routerze /scan */}
            <Text style={{color: '#32CD32'}}>Ok. {plant.points * 10} pkt</Text>
          </View>
        </View>
      ))}
      <View style={{height: 40}} />
    </ScrollView>
  );
};

// --- GŁÓWNY KOMPONENT ---
export default function Index() {
  const [camPermission, requestCamPermission] = useCameraPermissions();
  const [activeTab, setActiveTab] = useState<'camera' | 'plants' | 'rewards' | 'profile'>('camera');
  
  // Stan "Janusza" (Lokalny stan punktów)
  const [currentPoints, setCurrentPoints] = useState<number>(0);

  // Stan Skanowania
  const [isScanning, setIsScanning] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [resultData, setResultData] = useState<ScanResult | null>(null);
  const cameraRef = useRef<CameraView>(null);

  // 1. START: Pobierz punkty z backendu
  useEffect(() => {
    (async () => {
      const serverPoints = await getUserPoints();
      setCurrentPoints(serverPoints);
    })();
  }, []);

  // 2. SKANOWANIE
  const handleScan = async () => {
    if (isScanning || !cameraRef.current) return;
    setIsScanning(true);
    
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, skipProcessing: true });
      if (photo?.uri) {
        const data = await analyzePlant(photo.uri);
        setResultData(data);
        
        // Jeśli sukces -> Aktualizujemy punkty lokalnie (Optymistyczne UI)
        if (data.isInvasive) {
           setCurrentPoints(prev => prev + data.pointsEarned);
        }
        
        setModalVisible(true);
      }
    } catch (error) {
      Alert.alert("Błąd", "Problem z połączeniem z serwerem.");
    } finally {
      setIsScanning(false);
    }
  };

  // 3. KUPOWANIE NAGRODY (Logika tylko we Frontendzie dla MVP)
  const handleRedeem = (cost: number, name: string) => {
    Alert.alert(
      "Potwierdzenie",
      `Czy chcesz wymienić ${cost} pkt na: ${name}?`,
      [
        { text: "Anuluj", style: "cancel" },
        { 
          text: "Kupuję", 
          onPress: () => {
            // Odejmujemy punkty lokalnie
            setCurrentPoints(prev => prev - cost);
            
            // Generujemy losowy kod
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            Alert.alert(
                "Sukces! 🎉", 
                `Twoja nagroda: ${name}\n\nKOD KUPONU: ${code}\n\nPokaż go przy kasie!`
            );
          }
        }
      ]
    );
  };

  if (!camPermission || !camPermission.granted) {
    return <View style={styles.container}><Button onPress={requestCamPermission} title="Daj dostęp do kamery" /></View>;
  }

  return (
    <View style={styles.container}>
      
      {/* GŁÓWNA ZAWARTOŚĆ */}
      <View style={{ flex: 1 }}>
        {activeTab === 'camera' && (
          <CameraView ref={cameraRef} style={styles.camera} facing="back">
             <SafeAreaView style={styles.uiLayer}>
                <View style={styles.topOverlay}>
                  <Text style={{color:'white', fontWeight:'bold', fontSize: 18}}>
                    {USER_NAME}: {currentPoints} pkt
                  </Text>
                </View>
                <View style={styles.centerFocus}>
                  {isScanning ? <ActivityIndicator size="large" color="#32CD32" /> : <View style={styles.focusFrame} />}
                </View>
                <View style={styles.controlsContainer}>
                  <TouchableOpacity onPress={handleScan} disabled={isScanning}>
                    <LinearGradient colors={['#32CD32', '#228B22']} style={styles.scanButton}>
                      <Text style={styles.scanButtonText}>{isScanning ? 'ANALIZA...' : 'SKANUJ'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
             </SafeAreaView>
          </CameraView>
        )}
        {activeTab === 'plants' && <PlantsScreen />}
        {activeTab === 'rewards' && <RewardsScreen points={currentPoints} onRedeem={handleRedeem} />}
        {activeTab === 'profile' && <ProfileScreen points={currentPoints} />}
      </View>

      {/* PASEK NAWIGACJI */}
      <View style={styles.bottomBar}>
        {['camera', 'plants', 'rewards', 'profile'].map((tab) => (
          <TouchableOpacity key={tab} style={styles.navItem} onPress={() => setActiveTab(tab as any)}>
            <Ionicons 
              name={tab === 'camera' ? 'camera' : tab === 'plants' ? 'leaf' : tab === 'rewards' ? 'trophy' : 'person'} 
              size={28} 
              color={activeTab === tab ? '#32CD32' : '#ccc'} 
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* MODAL WYNIKU */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {resultData?.capturedImageUri && <Image source={{ uri: resultData.capturedImageUri }} style={styles.resultImage} />}
            <Text style={styles.modalTitle}>{resultData?.isInvasive ? "ZNALEZIONO!" : "BEZPIECZNA"}</Text>
            <Text style={[styles.plantName, !resultData?.isInvasive && {color:'green'}]}>{resultData?.plantName}</Text>
            <Text style={styles.desc}>{resultData?.description}</Text>
            {resultData?.isInvasive && (
               <View style={styles.pointsBadge}><Text style={styles.pointsText}>+{resultData.pointsEarned} PKT</Text></View>
            )}
            <Button title="Zamknij" onPress={() => setModalVisible(false)} color="#333" />
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  camera: { flex: 1 },
  uiLayer: { flex: 1, justifyContent: 'space-between', padding: 20 },
  topOverlay: { marginTop: 40, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', alignSelf: 'center', padding: 10, borderRadius: 20 },
  centerFocus: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  focusFrame: { width: 250, height: 300, borderWidth: 2, borderColor: 'white', borderStyle: 'dashed', borderRadius: 20 },
  controlsContainer: { alignItems: 'center', marginBottom: 20 },
  scanButton: { paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30 },
  scanButtonText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  bottomBar: { height: 80, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: 'white', elevation: 10 },
  navItem: { padding: 10 },
  
  screenContainer: { flex: 1, padding: 20, paddingTop: 60 },
  screenTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
  subTitle: { fontSize: 16, color: '#666', marginBottom: 20 },
  
  // Nagrody
  couponCard: { flexDirection: 'row', backgroundColor: 'white', padding: 20, borderRadius: 15, marginBottom: 15, alignItems: 'center', elevation: 2 },
  couponLeft: { width: 50, alignItems: 'center', marginRight: 15 },
  couponRight: { flex: 1 },
  couponTitle: { fontSize: 18, fontWeight: 'bold' },
  couponCost: { color: '#32CD32', fontWeight: 'bold', marginVertical: 5 },
  redeemButton: { backgroundColor: '#333', padding: 8, borderRadius: 10, alignSelf: 'flex-start' },
  redeemText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  
  // Profil
  profileHeader: { alignItems: 'center', marginBottom: 30 },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#32CD32', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  profileName: { fontSize: 24, fontWeight: 'bold' },
  profileLevel: { fontSize: 16, color: '#32CD32' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'white', padding: 20, borderRadius: 15, elevation: 2 },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: '#888' },
  activityItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 15, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },

  // Plant Card
  plantCard: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 1 },
  plantCardTitle: { fontWeight: 'bold', fontSize: 18 },
  
  // Modal Result
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: 'white', padding: 20, borderRadius: 20, alignItems: 'center' },
  resultImage: { width: 150, height: 150, borderRadius: 10, marginBottom: 15 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  plantName: { fontSize: 20, color: '#FF4500', marginBottom: 10 },
  desc: { textAlign: 'center', marginBottom: 15, color: '#555' },
  pointsBadge: { backgroundColor: '#FFD700', padding: 10, borderRadius: 10, marginBottom: 15 },
  pointsText: { fontWeight: 'bold', color: '#B8860B' }
});