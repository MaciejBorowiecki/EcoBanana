// utils/api.ts

export interface ScanResult {
  isInvasive: boolean;
  plantName: string;
  description: string;
  pointsEarned: number;
  reportId?: string;
  capturedImageUri?: string; // Dodajemy to, żeby wyświetlić zdjęcie w modalu
}

export interface UserProfile {
  points: number;
  level: string;
  scansCount: number;
}

// 1. Symulacja pobierania danych użytkownika z bazy
export const getUserProfile = async (): Promise<UserProfile> => {
  return new Promise((resolve) => {
    // Symulacja opóźnienia bazy danych
    setTimeout(() => {
      resolve({
        points: 1250, // To przyjdzie z bazy
        level: 'Ekspert',
        scansCount: 42
      });
    }, 500);
  });
};

// 2. Analiza zdjęcia (teraz przyjmuje prawdziwe URI)
export const analyzePlant = async (
  photoUri: string, 
  location: { lat: number; lng: number } | null
): Promise<ScanResult> => {
  
  return new Promise((resolve) => {
    console.log(`[BACKEND] Otrzymano zdjęcie: ${photoUri}`);
    console.log(`[BACKEND] Lokalizacja: ${JSON.stringify(location)}`);
    
    // Tutaj normalnie wysłałbyś plik na serwer jako FormData
    
    setTimeout(() => {
      const isDangerous = Math.random() > 0.4;

      if (isDangerous) {
        resolve({
          isInvasive: true,
          plantName: 'Barszcz Sosnowskiego',
          description: 'Roślina silnie parząca! Nie dotykaj.',
          pointsEarned: 50,
          reportId: '#ZG-' + Math.floor(Math.random() * 10000),
          capturedImageUri: photoUri // Odsyłamy URI, żeby wyświetlić w potwierdzeniu
        });
      } else {
        resolve({
          isInvasive: false,
          plantName: 'Nawłoć Pospolita',
          description: 'To bezpieczna roślina łąkowa.',
          pointsEarned: 5,
          capturedImageUri: photoUri
        });
      }
    }, 1500); // 1.5 sekundy analizy
  });
};