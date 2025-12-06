import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, 
  Dimensions, SafeAreaView, Modal, Button, ScrollView, Alert, Image, StatusBar
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location'; 

import { 
  analyzePlant, getPlantsDatabase, getUserPoints,
  ScanResult, PlantKnowledgeEntry 
} from '../../utils/api';

const { width } = Dimensions.get('window');

// Hard-coded mvp implemented data
const USER_NAME = "Janusz"; 
const USER_LEVEL = "Weed Hunter lvl. 67";

// List of rewards (mvp implemenation, should be done with a database)
const REWARDS = [
  { id: 1, name: "Roblox Gift Card 50 PLN", cost: 2000, icon: "gamepad-variant", color: "#000000", lib: "MaterialCommunityIcons" },
  { id: 2, name: "G2A Card 10 EUR", cost: 1500, icon: "steam", color: "#2d3436", lib: "FontAwesome5" },
  { id: 3, name: "Hot Dog from Żabka", cost: 300, icon: "food", color: "#27ae60", lib: "MaterialCommunityIcons" }, // Corrected icon name
  { id: 4, name: "Spotify Premium (1 month)", cost: 1000, icon: "spotify", color: "#1DB954", lib: "FontAwesome5" },
  { id: 5, name: "Helios Cinema Ticket", cost: 1200, icon: "film", color: "#e74c3c", lib: "FontAwesome5" },
  { id: 6, name: "Discount -20% at OBI", cost: 800, icon: "tools", color: "#e67e22", lib: "FontAwesome5" },
];

const ProfileScreen = ({ points }: { points: number }) => (
  <View style={styles.screenContainer}>
    <View style={styles.profileHeader}>
      <View style={styles.avatarCircle}>
        <Text style={{fontSize: 40, color: 'white'}}>{USER_NAME.charAt(0)}</Text>
      </View>
      <Text style={styles.profileName}>{USER_NAME}</Text>
      <Text style={styles.profileLevel}>{USER_LEVEL}</Text>
    </View>
    <View style={styles.statsRow}>
      <View style={styles.statBox}>
        <Text style={styles.statValue}>{points}</Text>
        <Text style={styles.statLabel}>Available Points</Text>
      </View>
    </View>
    
    <Text style={styles.sectionTitle}>Account Status:</Text>
    <View style={styles.activityItem}>
        <Ionicons name="checkmark-circle" size={24} color="#32CD32" />
        <View style={{marginLeft: 10}}>
          <Text style={{fontWeight: 'bold'}}>Account Active</Text>
          <Text style={{color:'#666', fontSize: 12}}>Connected to database</Text>
        </View>
    </View>
  </View>
);

const RewardsScreen = ({ points, onRedeem }: { points: number, onRedeem: (cost: number, name: string) => void }) => (
  <ScrollView style={styles.screenContainer}>
    <Text style={styles.screenTitle}>Rewards</Text>
    <Text style={styles.subTitle}>You have {points} pts. Spend wisely!</Text>
    
    {REWARDS.map(reward => (
      <View key={reward.id} style={styles.couponCard}>
        <View style={styles.couponLeft}>
          {reward.lib === "FontAwesome5" ? (
             <FontAwesome5 name={reward.icon as any} size={28} color={reward.color} />
          ) : (
             <MaterialCommunityIcons name={reward.icon as any} size={32} color={reward.color} />
          )}
        </View>
        <View style={styles.couponRight}>
          <Text style={styles.couponTitle}>{reward.name}</Text>
          <Text style={styles.couponCost}>{reward.cost} pts</Text>
          
          <TouchableOpacity 
            style={[styles.redeemButton, points < reward.cost && {backgroundColor: '#ccc'}]}
            disabled={points < reward.cost}
            onPress={() => onRedeem(reward.cost, reward.name)}
          >
            <Text style={styles.redeemText}>
              {points < reward.cost ? 'TOO EXPENSIVE' : 'REDEEM'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    ))}
    <View style={{height: 40}} />
  </ScrollView>
);

const PlantsScreen = () => {
  const [plants, setPlants] = useState<PlantKnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    getPlantsDatabase()
      .then(data => {
        setPlants(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <ScrollView style={styles.screenContainer}>
      <Text style={styles.screenTitle}>Invasive Database</Text>
      
      {loading && <ActivityIndicator color="#32CD32" size="large" style={{marginTop: 20}} />}

      {plants.map((plant, index) => (
        <View key={index} style={styles.plantCard}>
          <Text style={styles.plantCardTitle}>{plant.polish_name}</Text>
          <Text style={{fontStyle:'italic', color:'#666'}}>{plant.latin_name}</Text>
          <View style={{flexDirection:'row', justifyContent:'space-between', marginTop: 5}}>
            <Text style={{color: '#FF4500', fontWeight:'bold', flex: 1, marginRight: 10}} numberOfLines={1}>
              {plant.invasiveness}
            </Text>
            <Text style={{color: '#32CD32', fontWeight: 'bold'}}>
              {plant.points * 10} pts
            </Text>
          </View>
        </View>
      ))}
      <View style={{height: 40}} />
    </ScrollView>
  );
};

export default function Index() {
  const [camPermission, requestCamPermission] = useCameraPermissions();
  const [activeTab, setActiveTab] = useState<'camera' | 'plants' | 'rewards' | 'profile'>('camera');
  
  // Stan punktów (Default 0, to avoid crash)
  const [currentPoints, setCurrentPoints] = useState<number>(0);

  const [isScanning, setIsScanning] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [resultData, setResultData] = useState<ScanResult | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  
  const cameraRef = useRef<CameraView>(null);

  // Initialization
  useEffect(() => {
    (async () => {
      // Tracking GPS (not using it yet in database, because of mvp implementation)
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      }
      
      // Getting points from backend
      try {
        const points = await getUserPoints();
        // Making sure that points' a number
        if (typeof points === 'number' && !isNaN(points)) {
          setCurrentPoints(points);
        }
      } catch (e) {
        console.log("Error fetching points on startup");
      }
    })();
  }, []);

  // Scanning
  const handleScan = async () => {
    if (isScanning || !cameraRef.current) return;
    setIsScanning(true);
    
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, skipProcessing: true });
      if (photo?.uri) {
        const data = await analyzePlant(photo.uri);
        setResultData(data);
        if (data.isInvasive) {
           setCurrentPoints(prev => prev + data.pointsEarned);
        }
        
        setModalVisible(true);
      }
    } catch (error) {
      Alert.alert("Error", "Could not connect to server.");
    } finally {
      setIsScanning(false);
    }
  };

  // Reward shop
  const handleRedeem = (cost: number, name: string) => {
    Alert.alert(
      "Confirmation",
      `Buy: ${name}?`,
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes", 
          onPress: () => {
            setCurrentPoints(prev => Math.max(0, prev - cost));
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            Alert.alert("Success!", `Your code: ${code}`);
          }
        }
      ]
    );
  };

  if (!camPermission || !camPermission.granted) {
    return (
      <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <Text style={{marginBottom: 20}}>Camera access required</Text>
        <Button onPress={requestCamPermission} title="Grant access" />
      </View>
    );
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'camera':
        return (
          <CameraView ref={cameraRef} style={styles.camera} facing="back">
             <SafeAreaView style={styles.uiLayer}>
                <View style={styles.topOverlay}>
                  <Text style={{color:'white', fontWeight:'bold', fontSize: 18}}>
                    {USER_NAME}: {currentPoints} pts
                  </Text>
                </View>
                <View style={styles.centerFocus}>
                  {isScanning ? (
                    <ActivityIndicator size="large" color="#32CD32" />
                  ) : (
                    <View style={styles.focusFrame} />
                  )}
                </View>
                <View style={styles.controlsContainer}>
                  <TouchableOpacity onPress={handleScan} disabled={isScanning}>
                    <LinearGradient colors={['#32CD32', '#228B22']} style={styles.scanButton}>
                      <Text style={styles.scanButtonText}>
                        {isScanning ? 'ANALYZING...' : 'SCAN'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
             </SafeAreaView>
          </CameraView>
        );
      case 'plants': return <PlantsScreen />;
      case 'rewards': return <RewardsScreen points={currentPoints} onRedeem={handleRedeem} />;
      case 'profile': return <ProfileScreen points={currentPoints} />;
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Kontener na treść (zajmuje całą górę) */}
      <View style={{ flex: 1 }}>
        {renderScreen()}
      </View>

      {/* Dolny pasek nawigacji */}
      <View style={styles.bottomBar}>
        {['camera', 'plants', 'rewards', 'profile'].map((tab) => (
          <TouchableOpacity 
            key={tab} 
            style={styles.navItem} 
            onPress={() => setActiveTab(tab as any)}
          >
            <Ionicons 
              name={
                tab === 'camera' ? 'camera' : 
                tab === 'plants' ? 'leaf' : 
                tab === 'rewards' ? 'trophy' : 'person'
              } 
              size={28} 
              color={activeTab === tab ? '#32CD32' : '#ccc'} 
            />
          </TouchableOpacity>
        ))}
      </View>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {resultData?.capturedImageUri && (
              <Image source={{ uri: resultData.capturedImageUri }} style={styles.resultImage} />
            )}

            {resultData?.isInvasive ? (
              <>
                <Text style={styles.modalTitle}>FOUND!</Text>
                <Text style={styles.plantName}>{resultData.plantName}</Text>
                <Text style={styles.desc}>{resultData.description}</Text>
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsText}>+{resultData.pointsEarned} PTS</Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>SAFE</Text>
                <Text style={[styles.plantName, {color:'green'}]}>{resultData?.plantName}</Text>
                <Text style={styles.desc}>{resultData?.description}</Text>
              </>
            )}

            <TouchableOpacity 
              onPress={() => setModalVisible(false)} 
              style={styles.closeButton}
            >
              <Text style={{color:'white', fontWeight:'bold'}}>CLOSE</Text>
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
  uiLayer: { flex: 1, justifyContent: 'space-between', padding: 20 },
  topOverlay: { marginTop: 40, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
  centerFocus: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  focusFrame: { width: 250, height: 300, borderWidth: 2, borderColor: 'white', borderStyle: 'dashed', borderRadius: 20 },
  controlsContainer: { alignItems: 'center', marginBottom: 20 },
  scanButton: { paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30, elevation: 5 },
  scanButtonText: { color: 'white', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 },
  bottomBar: { height: 80, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#eee', elevation: 10 },
  navItem: { padding: 10, alignItems: 'center', justifyContent: 'center', width: 60 },
  
  screenContainer: { flex: 1, padding: 20, paddingTop: 60 },
  screenTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  subTitle: { fontSize: 16, color: '#666', marginBottom: 20 },
  
  couponCard: { flexDirection: 'row', backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 15, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  couponLeft: { width: 50, alignItems: 'center', marginRight: 15 },
  couponRight: { flex: 1 },
  couponTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  couponCost: { color: '#32CD32', fontWeight: 'bold', marginVertical: 5 },
  redeemButton: { backgroundColor: '#333', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, alignSelf: 'flex-start' },
  redeemText: { color: 'white', fontWeight: 'bold', fontSize: 10 },
  
  profileHeader: { alignItems: 'center', marginBottom: 30 },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#32CD32', justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 5 },
  profileName: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  profileLevel: { fontSize: 14, color: '#32CD32', fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'white', padding: 20, borderRadius: 15, elevation: 2, marginBottom: 30 },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  statLabel: { color: '#888', fontSize: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  activityItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 12, elevation: 1 },

  plantCard: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2 },
  plantCardTitle: { fontWeight: 'bold', fontSize: 16, color: '#333' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: 'white', padding: 25, borderRadius: 25, alignItems: 'center', elevation: 10 },
  resultImage: { width: 140, height: 140, borderRadius: 15, marginBottom: 15, borderWidth: 2, borderColor: '#eee' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  plantName: { fontSize: 20, color: '#FF4500', fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  desc: { textAlign: 'center', marginBottom: 20, color: '#666', lineHeight: 20 },
  pointsBadge: { backgroundColor: '#FFD700', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginBottom: 20 },
  pointsText: { fontWeight: 'bold', color: '#B8860B', fontSize: 16 },
  closeButton: { backgroundColor: '#333', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 20 },
});