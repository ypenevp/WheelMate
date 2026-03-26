import { useState, useEffect, useRef } from 'react';
import {
  Text, View, TouchableOpacity, StyleSheet,
  Alert, ScrollView, ActivityIndicator, Dimensions, Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import "../global.css";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const ORS_API_KEY = process.env.EXPO_PUBLIC_ORS_API_KEY;

const STEP_LABEL = {
  0: 'LEFT', 1: 'RIGHT', 2: 'SHARP LEFT', 3: 'SHARP RIGHT',
  4: 'SLIGHT LEFT', 5: 'SLIGHT RIGHT', 6: 'STRAIGHT',
  7: 'ROUNDABOUT', 8: 'EXIT ROUNDABOUT', 10: 'U-TURN',
  11: 'ARRIVE', 12: 'DEPART',
};
const STEP_ARROW = {
  0: '↰', 1: '↱', 2: '↰', 3: '↱', 4: '↖', 5: '↗',
  6: '↑', 7: '⟳', 8: '⟳', 10: '↩', 11: '⚑', 12: '●',
};

function formatDist(m) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

function buildMapHTML(lat, lng) {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body,#map{width:100%;height:100%}
  .leaflet-control-attribution{display:none}
</style>
</head>
<body>
<div id="map"></div>
<script>
var map=L.map('map',{zoomControl:true}).setView([${lat},${lng}],15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);

var userIcon=L.divIcon({className:'',html:'<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 6px rgba(0,0,0,.4)"></div>',iconSize:[16,16],iconAnchor:[8,8]});
L.marker([${lat},${lng}],{icon:userIcon}).addTo(map);

var destIcon=L.divIcon({className:'',html:'<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#22c55e;border:3px solid #fff;box-shadow:0 0 8px rgba(0,0,0,.4);transform:rotate(-45deg)"></div>',iconSize:[22,22],iconAnchor:[11,22]});
var destMarker=null,routeLines=[];

map.on('click',function(e){
  if(destMarker)map.removeLayer(destMarker);
  destMarker=L.marker([e.latlng.lat,e.latlng.lng],{icon:destIcon}).addTo(map);
  window.ReactNativeWebView.postMessage(JSON.stringify({type:'pin',lat:e.latlng.lat,lng:e.latlng.lng}));
});

function handleMsg(e){
  try{
    var msg=JSON.parse(e.data);
    if(msg.type==='route'){
      routeLines.forEach(function(l){map.removeLayer(l)});routeLines=[];
      var c=msg.coords.map(function(p){return[p.latitude,p.longitude]});
      routeLines.push(L.polyline(c,{color:'rgba(0,0,0,.2)',weight:8}).addTo(map));
      routeLines.push(L.polyline(c,{color:'#22c55e',weight:5}).addTo(map));
      map.fitBounds(routeLines[1].getBounds(),{padding:[40,40]});
    }
    if(msg.type==='reset'){
      if(destMarker){map.removeLayer(destMarker);destMarker=null;}
      routeLines.forEach(function(l){map.removeLayer(l)});routeLines=[];
    }
  }catch(err){}
}
document.addEventListener('message',handleMsg);
window.addEventListener('message',handleMsg);
<\/script>
</body>
</html>`;
}

export default function MapPage() {
  const webViewRef = useRef(null);
  const panelAnim  = useRef(new Animated.Value(0)).current;

  const [location,    setLocation] = useState(null);
  const [destination, setDest]     = useState(null);
  const [steps,       setSteps]    = useState([]);
  const [summary,     setSummary]  = useState(null);
  const [phase,       setPhase]    = useState('locating');

  const slideIn = () => {
    panelAnim.setValue(0);
    Animated.spring(panelAnim, { toValue:1, useNativeDriver:true, tension:80, friction:12 }).start();
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission denied','Location access is needed.'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc.coords);
      setPhase('pinning');
    })();
  }, []);

  const onMessage = (e) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'pin') {
        setDest({ latitude: msg.lat, longitude: msg.lng });
        setSteps([]); setSummary(null);
        setPhase('ready'); slideIn();
      }
    } catch {}
  };

  const fetchRoute = async () => {
    if (!location || !destination) return;
    setPhase('routing');
    try {
      const url =
        `https://api.openrouteservice.org/v2/directions/wheelchair` +
        `?api_key=${ORS_API_KEY}` +
        `&start=${location.longitude},${location.latitude}` +
        `&end=${destination.longitude},${destination.latitude}`;
      const res  = await fetch(url, { headers: { Accept: 'application/geo+json' } });
      const data = await res.json();
      if (!res.ok || !data.features?.length) {
        Alert.alert('No route found', data.error?.message || 'No wheelchair route available.');
        setPhase('ready'); return;
      }
      const feature  = data.features[0];
      const coords   = feature.geometry.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
      const allSteps = feature.properties.segments.flatMap((s) => s.steps);
      setSteps(allSteps);
      setSummary({ distance: feature.properties.summary.distance, duration: feature.properties.summary.duration });
      setPhase('done'); slideIn();
      webViewRef.current?.postMessage(JSON.stringify({ type: 'route', coords }));
    } catch (err) {
      Alert.alert('Error', err.message); setPhase('ready');
    }
  };

  const reset = () => {
    setDest(null); setSteps([]); setSummary(null);
    panelAnim.setValue(0); setPhase('pinning');
    webViewRef.current?.postMessage(JSON.stringify({ type: 'reset' }));
  };

  return (
    <View style={s.root}>

      {/* MAP */}
      {location ? (
        <WebView
          ref={webViewRef}
          style={s.map}
          originWhitelist={['*']}
          source={{ html: buildMapHTML(location.latitude, location.longitude) }}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={s.placeholder}>
              <ActivityIndicator size="large" color="#22c55e" />
            </View>
          )}
        />
      ) : (
        <View style={s.placeholder}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={s.muted}>Locating you…</Text>
        </View>
      )}

      {/* HINT */}
      {phase === 'pinning' && (
        <View style={s.hint} pointerEvents="none">
          <Text style={s.hintText}>Tap the map to pin your destination</Text>
        </View>
      )}

      {/* BOTTOM PANEL */}
      {(phase === 'ready' || phase === 'routing' || phase === 'done') && (
        <Animated.View style={[s.panel,{transform:[{translateY:panelAnim.interpolate({inputRange:[0,1],outputRange:[300,0]})}]}]}>

          {/* READY */}
          {phase === 'ready' && destination && (
            <>
              <View style={s.row}>
                <View>
                  <Text style={s.title}>Where to?</Text>
                  <Text style={s.sub}>{destination.latitude.toFixed(5)}, {destination.longitude.toFixed(5)}</Text>
                </View>
                <TouchableOpacity onPress={reset} style={s.closeBtn}>
                  <Text style={s.closeTxt}>✕</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={s.goBtn} onPress={fetchRoute} activeOpacity={0.85}>
                {/* <Text style={s.goBtnIcon}></Text> */}
                <Text style={s.goBtnTxt}>Get Wheelchair Route</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ROUTING */}
          {phase === 'routing' && (
            <View style={s.centered}>
              <ActivityIndicator size="large" color="#22c55e" />
              <Text style={s.muted}>Finding accessible route…</Text>
            </View>
          )}

          {/* DONE */}
          {phase === 'done' && steps.length > 0 && (
            <>
              <View style={s.row}>
                <View>
                  <Text style={s.title}>Directions</Text>
                  {summary && (
                    <Text style={s.sub}>{formatDist(summary.distance)}  ·  {Math.round(summary.duration / 60)} min</Text>
                  )}
                </View>
                <TouchableOpacity onPress={reset} style={s.closeBtn}>
                  <Text style={[s.closeTxt,{color:'#ef4444'}]}>✕ Reset</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={s.list} showsVerticalScrollIndicator={false}
                contentContainerStyle={{paddingBottom:12}}>
                {steps.map((step, i) => (
                  <View key={i} style={[s.stepRow, i===steps.length-1&&{borderBottomWidth:0}]}>
                    <View style={[s.badge, step.type===11&&s.badgeArrive]}>
                      <Text style={s.arrow}>{STEP_ARROW[step.type]??'→'}</Text>
                    </View>
                    <View style={s.stepMid}>
                      <Text style={s.stepLabel}>{STEP_LABEL[step.type]??'CONTINUE'}</Text>
                      <Text style={s.stepTxt} numberOfLines={2}>{step.instruction}</Text>
                    </View>
                    <View style={s.chip}>
                      <Text style={s.chipTxt}>{formatDist(step.distance)}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex:1, backgroundColor:'#0a0a0a' },
  map:         { flex:1 },
  placeholder: { flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'#111', gap:14 },
  muted:       { color:'#6b7280', fontSize:14 },

  hint: {
    position:'absolute', top:52, alignSelf:'center',
    backgroundColor:'rgba(10,10,10,0.82)', paddingHorizontal:18, paddingVertical:10,
    borderRadius:30, borderWidth:1, borderColor:'rgba(255,255,255,0.08)',
  },
  hintText: { color:'#fff', fontSize:14, fontWeight:'600' },

  panel: {
    backgroundColor:'#111827', borderTopLeftRadius:22, borderTopRightRadius:22,
    paddingHorizontal:20, paddingTop:16, paddingBottom:24,
    maxHeight:SCREEN_HEIGHT*0.48, minHeight:300,
    borderTopWidth:1, borderColor:'rgba(255,255,255,0.06)',
    shadowColor:'#000', shadowOffset:{width:0,height:-8},
    shadowOpacity:0.5, shadowRadius:16, elevation:20,
  },
  row:      { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 },
  title:    { color:'#f9fafb', fontSize:18, fontWeight:'700' },
  sub:      { color:'#6b7280', fontSize:12, marginTop:2 },
  closeBtn: { paddingHorizontal:8, paddingVertical:4 },
  closeTxt: { color:'#6b7280', fontWeight:'600', fontSize:14 },

  goBtn: {
    flexDirection:'row', alignItems:'center', justifyContent:'center',
    backgroundColor:'#22c55e', borderRadius:14, paddingVertical:15, gap:10,
    shadowColor:'#22c55e', shadowOffset:{width:0,height:4},
    shadowOpacity:0.35, shadowRadius:10, elevation:8,
  },
  goBtnIcon: { fontSize:20 },
  goBtnTxt:  { color:'#fff', fontWeight:'700', fontSize:16 },

  centered: { alignItems:'center', justifyContent:'center', paddingVertical:24, gap:12 },

  list:    { flex:1 },
  stepRow: {
    flexDirection:'row', alignItems:'center', paddingVertical:11,
    borderBottomWidth:1, borderBottomColor:'rgba(255,255,255,0.05)', gap:12,
  },
  badge:       { width:38,height:38,borderRadius:10,backgroundColor:'#1f2937',alignItems:'center',justifyContent:'center',flexShrink:0 },
  badgeArrive: { backgroundColor:'rgba(34,197,94,0.15)' },
  arrow:       { fontSize:18 },
  stepMid:     { flex:1 },
  stepLabel:   { color:'#22c55e', fontSize:10, fontWeight:'800', letterSpacing:1.2, marginBottom:2 },
  stepTxt:     { color:'#d1d5db', fontSize:13, lineHeight:18 },
  chip:        { backgroundColor:'#1f2937', borderRadius:8, paddingHorizontal:8, paddingVertical:4, flexShrink:0 },
  chipTxt:     { color:'#9ca3af', fontSize:11, fontWeight:'700' },
});