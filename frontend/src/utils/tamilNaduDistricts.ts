export interface DistrictInfo {
  id: string;
  name: string;
  tamilName: string;
  center: [number, number]; // [lat, lon]
}

export const TAMIL_NADU_CENTER: [number, number] = [11.0598, 78.3875];
export const TAMIL_NADU_DEFAULT_ZOOM = 7;

export const TAMIL_NADU_BOUNDS = {
  minLat: 8.0,
  maxLat: 13.6,
  minLon: 76.1,
  maxLon: 80.5,
};

export const isWithinTamilNadu = (lat: number, lon: number): boolean => {
  return (
    lat >= TAMIL_NADU_BOUNDS.minLat &&
    lat <= TAMIL_NADU_BOUNDS.maxLat &&
    lon >= TAMIL_NADU_BOUNDS.minLon &&
    lon <= TAMIL_NADU_BOUNDS.maxLon
  );
};

export const TAMIL_NADU_DISTRICTS: DistrictInfo[] = [
  { id: 'ariyalur', name: 'Ariyalur', tamilName: 'அரியலூர்', center: [11.1401, 79.0786] },
  { id: 'chengalpattu', name: 'Chengalpattu', tamilName: 'செங்கல்பட்டு', center: [12.6841, 79.9836] },
  { id: 'chennai', name: 'Chennai', tamilName: 'சென்னை', center: [13.0827, 80.2707] },
  { id: 'coimbatore', name: 'Coimbatore', tamilName: 'கோயம்புத்தூர்', center: [11.0168, 76.9558] },
  { id: 'cuddalore', name: 'Cuddalore', tamilName: 'கடலூர்', center: [11.7480, 79.7714] },
  { id: 'dharmapuri', name: 'Dharmapuri', tamilName: 'தருமபுரி', center: [12.1211, 78.1582] },
  { id: 'dindigul', name: 'Dindigul', tamilName: 'திண்டுக்கல்', center: [10.3673, 77.9803] },
  { id: 'erode', name: 'Erode', tamilName: 'ஈரோடு', center: [11.3410, 77.7172] },
  { id: 'kallakurichi', name: 'Kallakurichi', tamilName: 'கள்ளக்குறிச்சி', center: [11.7384, 78.9639] },
  { id: 'kanchipuram', name: 'Kanchipuram', tamilName: 'காஞ்சிபுரம்', center: [12.8342, 79.7036] },
  { id: 'kanyakumari', name: 'Kanyakumari', tamilName: 'கன்னியாகுமரி', center: [8.1833, 77.4119] },
  { id: 'karur', name: 'Karur', tamilName: 'கரூர்', center: [10.9601, 78.0766] },
  { id: 'krishnagiri', name: 'Krishnagiri', tamilName: 'கிருஷ்ணகிரி', center: [12.5186, 78.2137] },
  { id: 'madurai', name: 'Madurai', tamilName: 'மதுரை', center: [9.9252, 78.1198] },
  { id: 'mayiladuthurai', name: 'Mayiladuthurai', tamilName: 'மயிலாடுதுறை', center: [11.1075, 79.6523] },
  { id: 'nagapattinam', name: 'Nagapattinam', tamilName: 'நாகப்பட்டினம்', center: [10.7672, 79.8449] },
  { id: 'namakkal', name: 'Namakkal', tamilName: 'நாமக்கல்', center: [11.2189, 78.1674] },
  { id: 'nilgiris', name: 'Nilgiris (Ooty)', tamilName: 'நீலகிரி', center: [11.4102, 76.6950] },
  { id: 'perambalur', name: 'Perambalur', tamilName: 'பெரம்பலூர்', center: [11.2342, 78.8820] },
  { id: 'pudukkottai', name: 'Pudukkottai', tamilName: 'புதுக்கோட்டை', center: [10.3833, 78.8001] },
  { id: 'ramanathapuram', name: 'Ramanathapuram', tamilName: 'ராமநாதபுரம்', center: [9.3639, 78.8395] },
  { id: 'ranipet', name: 'Ranipet', tamilName: 'ராணிப்பேட்டை', center: [12.9229, 79.3329] },
  { id: 'salem', name: 'Salem', tamilName: 'சேலம்', center: [11.6643, 78.1460] },
  { id: 'sivaganga', name: 'Sivaganga', tamilName: 'சிவகங்கை', center: [9.8433, 78.4809] },
  { id: 'tenkasi', name: 'Tenkasi', tamilName: 'தென்காசி', center: [8.9594, 77.3150] },
  { id: 'thanjavur', name: 'Thanjavur', tamilName: 'தஞ்சாவூர்', center: [10.7870, 79.1378] },
  { id: 'theni', name: 'Theni', tamilName: 'தேனி', center: [10.0104, 77.4768] },
  { id: 'thoothukudi', name: 'Thoothukudi', tamilName: 'தூத்துக்குடி', center: [8.7642, 78.1348] },
  { id: 'tiruchirappalli', name: 'Tiruchirappalli', tamilName: 'திருச்சிராப்பள்ளி', center: [10.7905, 78.7047] },
  { id: 'tirunelveli', name: 'Tirunelveli', tamilName: 'திருநெல்வேலி', center: [8.7139, 77.7567] },
  { id: 'tirupathur', name: 'Tirupathur', tamilName: 'திருப்பத்தூர்', center: [12.4960, 78.5678] },
  { id: 'tiruppur', name: 'Tiruppur', tamilName: 'திருப்பூர்', center: [11.1085, 77.3411] },
  { id: 'tiruvallur', name: 'Tiruvallur', tamilName: 'திருவள்ளூர்', center: [13.1437, 79.9083] },
  { id: 'tiruvannamalai', name: 'Tiruvannamalai', tamilName: 'திருவண்ணாமலை', center: [12.2253, 79.0747] },
  { id: 'tiruvarur', name: 'Tiruvarur', tamilName: 'திருவாரூர்', center: [10.7725, 79.6365] },
  { id: 'vellore', name: 'Vellore', tamilName: 'வேலூர்', center: [12.9165, 79.1325] },
  { id: 'viluppuram', name: 'Viluppuram', tamilName: 'விழுப்புரம்', center: [11.9401, 79.4861] },
  { id: 'virudhunagar', name: 'Virudhunagar', tamilName: 'விருதுநகர்', center: [9.5872, 77.9514] },
];
