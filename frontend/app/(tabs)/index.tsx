import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  Image // Dodane do wyświetlania zdjęcia
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location'; 
import { getPlantsDatabase, PlantKnowledgeEntry } from '../../utils/api';

// Import funkcji z naszego "backendu"
import { analyzePlant, getUserProfile, ScanResult, UserProfile } from '../../utils/api';

const { width } = Dimensions.get('window');

// --- EKRANY POMOCNICZE (UI) ---

// 1. Profil teraz przyjmuje dane dynamicznie (props)
const ProfileScreen = ({ user }: { user: UserProfile | null }) => {
  if (!user) return <ActivityIndicator color="#32CD32" style={{marginTop: 50}} />;

  return (
    <View style={styles.screenContainer}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={50} color="#FFF" />
        </View>
        <Text style={styles.profileName}>Łowca Roślin</Text>
        <Text style={styles.profileLevel}>Poziom: {user.level}</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          {/* Tu wyświetlamy prawdziwe punkty */}
          <Text style={styles.statValue}>{user.points}</Text>
          <Text style={styles.statLabel}>Punkty</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{user.scansCount}</Text>
          <Text style={styles.statLabel}>Zgłoszenia</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Twoje ostatnie akcje:</Text>
      <View style={styles.activityItem}>
        <Ionicons name="checkmark-circle" size={24} color="#32CD32" />
        <Text style={{marginLeft:10, color:'#555'}}>Zgłoszono Barszcz (+50pkt)</Text>
      </View>
    </View>
  );
};

const RewardsScreen = () => (
  <ScrollView style={styles.screenContainer}>
    <Text style={styles.screenTitle}>Nagrody</Text>
    <Text style={styles.subTitle}>Wymień punkty na zniżki!</Text>
    
    {/* Karta 1: Kawa */}
    <View style={styles.couponCard}>
      <View style={styles.couponLeft}><FontAwesome5 name="coffee" size={30} color="#8B4513" /></View>
      <View style={styles.couponRight}>
        <Text style={styles.couponTitle}>Darmowa Kawa</Text>
        <Text style={styles.couponCost}>500 pkt</Text>
        <TouchableOpacity style={styles.redeemButton}><Text style={styles.redeemText}>Odbierz</Text></TouchableOpacity>
      </View>
    </View>

    {/* Karta 2: Bilet (To co brakowało) */}
    <View style={styles.couponCard}>
      <View style={styles.couponLeft}><FontAwesome5 name="bus" size={30} color="#000" /></View>
      <View style={styles.couponRight}>
        <Text style={styles.couponTitle}>Bilet 24h MPK</Text>
        <Text style={styles.couponCost}>1000 pkt</Text>
        <TouchableOpacity style={styles.redeemButton}><Text style={styles.redeemText}>Odbierz</Text></TouchableOpacity>
      </View>
    </View>
  </ScrollView>
);

const PlantsScreen = () => {
  const [plants, setPlants] = useState<PlantKnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pobieramy dane przy wejściu na ekran
    const loadData = async () => {
      const data = await getPlantsDatabase();
      setPlants(data);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={styles.screenContainer}>
        <ActivityIndicator size="large" color="#32CD32" />
        <Text style={{textAlign:'center', marginTop: 10}}>Aktualizowanie bazy wiedzy...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screenContainer}>
      <Text style={styles.screenTitle}>Baza Inwazyjna</Text>
      <Text style={styles.subTitle}>Lista gatunków monitorowanych przez system.</Text>
      
      {plants.map((plant, index) => (
        <View key={index} style={styles.plantCard}>
          <Text style={styles.plantCardTitle}>{plant.polish_name}</Text>
          <Text style={{fontStyle: 'italic', color: '#666', marginBottom: 5}}>{plant.latin_name}</Text>
          <Text style={styles.plantCardDesc}>
             Stopień inwazyjności: {plant.invasiveness}
          </Text>
          
          <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
            <View style={[styles.dangerBadge, { 
                backgroundColor: plant.points > 4 ? '#FF4500' : '#FFA500' 
              }]}>
              <Text style={styles.dangerText}>
                {plant.points > 4 ? 'WYSOKIE RYZYKO' : 'ŚREDNIE RYZYKO'}
              </Text>
            </View>
            <Text style={{fontWeight:'bold', color:'#32CD32'}}>
              Wartość: {plant.points * 10} PKT
            </Text>
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
  
  // Stan logiki
  const [isScanning, setIsScanning] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [resultData, setResultData] = useState<ScanResult | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  
  // NOWE: Stan użytkownika (punkty z bazy)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // NOWE: Referencja do kamery (by robić zdjęcia)
  const cameraRef = useRef<CameraView>(null);

  // 1. Pobieranie lokalizacji i profilu usera przy starcie
  useEffect(() => {
    (async () => {
      // GPS
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      }
      
      // Pobierz dane usera z "Bazy"
      const profile = await getUserProfile();
      setUserProfile(profile);
    })();
  }, []);

  // 2. Logika Skanowania (Prawdziwe zdjęcie)
  const handleScan = async () => {
    if (isScanning || !cameraRef.current) return;
    setIsScanning(true);
    
    try {
      // A. Robimy prawdziwe zdjęcie!
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5, // Kompresja dla szybkości
        base64: false, // Na razie wystarczy nam URI
        skipProcessing: true // Szybciej
      });

      // B. Przygotuj koordynaty
      const locCoords = location ? { 
        lat: location.coords.latitude, 
        lng: location.coords.longitude 
      } : null;

      // C. Wyślij zdjęcie do "API"
      if (photo?.uri) {
        const data = await analyzePlant(photo.uri, locCoords);
        setResultData(data);
        
        // D. Aktualizuj punkty (symulacja zapisu w bazie)
        if (userProfile) {
          setUserProfile({
            ...userProfile,
            points: userProfile.points + data.pointsEarned,
            scansCount: userProfile.scansCount + 1
          });
        }
        
        setModalVisible(true);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Błąd", "Nie udało się przetworzyć zdjęcia.");
    } finally {
      setIsScanning(false);
    }
  };

  const closeResult = () => {
    setModalVisible(false);
    setResultData(null);
  };

  if (!camPermission || !camPermission.granted) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ marginBottom: 20 }}>Aplikacja wymaga dostępu do kamery</Text>
        <Button onPress={requestCamPermission} title="Przyznaj dostęp" />
      </View>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'camera':
        return (
          <CameraView 
            ref={cameraRef} // Przypinamy ref
            style={styles.camera} 
            facing="back"
          >
            <SafeAreaView style={styles.uiLayer}>
              <View style={styles.topOverlay}>
                <View style={styles.badge}>
                  <Ionicons name="scan-outline" size={16} color="white" />
                  <Text style={styles.topText}>BioBounty AI</Text>
                </View>
              </View>

              <View style={styles.centerFocus}>
                {isScanning ? (
                  <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#32CD32" />
                    <Text style={styles.scanningText}>Wysyłanie danych...</Text>
                  </View>
                ) : (
                  <View style={styles.focusFrame}>
                    <View style={[styles.corner, styles.tl]} />
                    <View style={[styles.corner, styles.tr]} />
                    <View style={[styles.corner, styles.bl]} />
                    <View style={[styles.corner, styles.br]} />
                  </View>
                )}
              </View>

              <View style={styles.controlsContainer}>
                <TouchableOpacity onPress={handleScan} activeOpacity={0.8} disabled={isScanning}>
                  <LinearGradient
                    colors={['#32CD32', '#228B22']}
                    style={styles.scanButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="aperture" size={24} color="white" style={{marginRight: 10}} />
                    <Text style={styles.scanButtonText}>
                      {isScanning ? 'PRZETWARZANIE...' : 'SKANUJ'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </CameraView>
        );
      case 'plants': return <PlantsScreen />;
      case 'rewards': return <RewardsScreen />;
      case 'profile': return <ProfileScreen user={userProfile} />; // Przekazujemy usera
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>{renderContent()}</View>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('camera')}>
          <Ionicons name="camera" size={28} color={activeTab === 'camera' ? '#32CD32' : '#ccc'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('plants')}>
          <Ionicons name="leaf" size={28} color={activeTab === 'plants' ? '#32CD32' : '#ccc'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('rewards')}>
          <Ionicons name="trophy" size={28} color={activeTab === 'rewards' ? '#32CD32' : '#ccc'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('profile')}>
          <Ionicons name="person" size={28} color={activeTab === 'profile' ? '#32CD32' : '#ccc'} />
        </TouchableOpacity>
      </View>

      {/* Modal Wyniku */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={closeResult}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* Wyświetlamy zrobione zdjęcie! */}
            {resultData?.capturedImageUri && (
              <Image 
                source={{ uri: resultData.capturedImageUri }} 
                style={styles.resultImage} 
              />
            )}

            {resultData?.isInvasive ? (
              <>
                <Text style={styles.modalTitle}>Wykryto zagrożenie!</Text>
                <Text style={styles.plantName}>{resultData.plantName}</Text>
                <Text style={styles.desc}>{resultData.description}</Text>
                
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsText}>+{resultData.pointsEarned} PKT</Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Roślina bezpieczna</Text>
                <Text style={[styles.plantName, {color: '#228B22'}]}>{resultData?.plantName}</Text>
                <Text style={styles.desc}>{resultData?.description}</Text>
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
  topOverlay: { alignItems: 'center', marginTop: 60 },
  badge: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
  topText: { color: 'white', marginLeft: 8, fontWeight: '600' },
  centerFocus: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  focusFrame: { width: 280, height: 300, position: 'relative' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: 'white', borderWidth: 4, borderRadius: 2 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  loaderContainer: { backgroundColor: 'rgba(0,0,0,0.85)', padding: 25, borderRadius: 20, alignItems: 'center' },
  scanningText: { color: 'white', marginTop: 15, fontWeight: 'bold', fontSize: 16 },
  controlsContainer: { alignItems: 'center', marginBottom: 30 },
  scanButton: { flexDirection: 'row', width: width * 0.85, paddingVertical: 18, borderRadius: 30, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  scanButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  bottomBar: { height: 90, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#eee', elevation: 20 },
  navItem: { alignItems: 'center', justifyContent: 'center', height: '100%', width: 70 },
  
  // Modal i Wyniki
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: 'white', padding: 25, borderRadius: 30, alignItems: 'center', elevation: 10 },
  resultImage: { width: 120, height: 120, borderRadius: 15, marginBottom: 15, borderWidth: 3, borderColor: '#eee' },
  modalTitle: { fontSize: 26, fontWeight: 'bold', color: '#333' },
  plantName: { fontSize: 22, color: '#FF4500', fontWeight: 'bold', marginVertical: 8 },
  desc: { textAlign: 'center', color: '#666', marginVertical: 10, fontSize: 16 },
  pointsBadge: { backgroundColor: '#FFD700', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 15, marginTop: 15 },
  pointsText: { fontWeight: 'bold', color: '#B8860B', fontSize: 18 },
  closeButton: { marginTop: 20, backgroundColor: '#333', paddingHorizontal: 50, paddingVertical: 14, borderRadius: 25 },
  closeButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  // Ekrany
  screenContainer: { flex: 1, padding: 20, paddingTop: 60 },
  screenTitle: { fontSize: 32, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  subTitle: { fontSize: 16, color: '#666', marginBottom: 25 },
  profileHeader: { alignItems: 'center', marginBottom: 30 },
  avatarCircle: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#32CD32', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  profileName: { fontSize: 26, fontWeight: 'bold' },
  profileLevel: { color: '#32CD32', fontWeight: '600', fontSize: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30, backgroundColor: 'white', padding: 20, borderRadius: 20, elevation: 3 },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  statLabel: { color: '#888' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  activityItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 10, elevation: 1 },
  couponCard: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 15, elevation: 3, alignItems: 'center' },
  couponLeft: { width: 60, alignItems: 'center' },
  couponRight: { flex: 1, paddingLeft: 15 },
  couponTitle: { fontSize: 18, fontWeight: 'bold' },
  couponCost: { color: '#32CD32', fontWeight: 'bold', marginBottom: 10 },
  redeemButton: { backgroundColor: '#333', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, alignSelf: 'flex-start' },
  redeemText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  plantCard: { backgroundColor: 'white', padding: 20, borderRadius: 20, marginBottom: 15, elevation: 3 },
  plantCardTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  plantCardDesc: { color: '#555', marginBottom: 15 },
  dangerBadge: { backgroundColor: '#FF4500', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  dangerText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
});