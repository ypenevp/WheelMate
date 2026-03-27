import { useState, useEffect, useRef } from 'react';
import {
  Text, View, TouchableOpacity, StyleSheet,
  Alert, ScrollView, ActivityIndicator, Dimensions, Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import "../global.css";
import { API_URL } from "@env";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const ORS_API_KEY = process.env.EXPO_PUBLIC_ORS_API_KEY;
const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:8080'; // Настройте с вашия локален IP адрес

// Normalise step type → canonical label the ESP32 drawArrow understands
const BLE_DIR = {
  0: 'LEFT', 1: 'RIGHT', 2: 'LEFT', 3: 'RIGHT',
  4: 'LEFT', 5: 'RIGHT', 6: 'STRAIGHT', 7: 'STRAIGHT',
  8: 'STRAIGHT', 10: 'UTURN', 11: 'ARRIVE',
};

// Simple OLED-friendly labels — no prose directions
const STEP_LABEL = {
  0: 'LEFT', 1: 'RIGHT', 2: 'SHARP LEFT',
  3: 'SHARP RIGHT', 4: 'SLIGHT LEFT', 5: 'SLIGHT RIGHT',
  6: 'STRAIGHT', 7: 'ROUNDABOUT', 8: 'EXIT ROUNDABOUT',
  10: 'U-TURN', 11: 'ARRIVE', 12: 'DEPART',
};
const STEP_ARROW = {
  0: '↰', 1: '↱', 2: '↰', 3: '↱', 4: '↖', 5: '↗',
  6: '↑', 7: '⟳', 8: '⟳', 10: '↩', 11: '⚑', 12: '●',
};

const ARRIVE_RADIUS = 10;    // metres — destination reached
const OFF_COURSE_DIST = 20;    // metres from route → reroute (was 40)
const REROUTE_COOLDOWN = 15000; // ms minimum between reroutes
const WAYPOINT_RADIUS = 25;    // metres — advance to next step

function formatDist(m) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

function formatETA(seconds) {
  if (seconds == null) return null;
  const m = Math.round(seconds / 60);
  if (m < 1) return '< 1 min';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

function haversine(a, b) {
  const R = 6371000;
  const φ1 = (a.latitude * Math.PI) / 180;
  const φ2 = (b.latitude * Math.PI) / 180;
  const Δφ = ((b.latitude - a.latitude) * Math.PI) / 180;
  const Δλ = ((b.longitude - a.longitude) * Math.PI) / 180;
  const s = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

// ── Leaflet map HTML ──────────────────────────────────────────────
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
  @keyframes pulse{0%{transform:scale(1);opacity:1}50%{transform:scale(1.5);opacity:0.5}100%{transform:scale(1);opacity:1}}
  .user-dot{animation:pulse 2s infinite}
</style>
</head>
<body>
<div id="map"></div>
<script>
var map=L.map('map',{zoomControl:true}).setView([${lat},${lng}],15);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {maxZoom:19}).addTo(map);

var userIcon=L.divIcon({className:'',html:'<div class="user-dot" style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 6px rgba(0,0,0,.4)"></div>',iconSize:[16,16],iconAnchor:[8,8]});
var userMarker=L.marker([${lat},${lng}],{icon:userIcon}).addTo(map);

// ПРОМЕНЕНО: dest icon вече е син (#3b82f6)
var destIcon=L.divIcon({className:'',html:'<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 8px rgba(0,0,0,.4);transform:rotate(-45deg)"></div>',iconSize:[22,22],iconAnchor:[11,22]});
var destMarker=null,routeLines=[];

map.on('click',function(e){
  if(destMarker)map.removeLayer(destMarker);
  destMarker=L.marker([e.latlng.lat,e.latlng.lng],{icon:destIcon}).addTo(map);
  window.ReactNativeWebView.postMessage(JSON.stringify({type:'pin',lat:e.latlng.lat,lng:e.latlng.lng}));
});

function handleMsg(e){
  try{
    var msg=JSON.parse(e.data);
    if(msg.type==='route'||msg.type==='trimRoute'){
      routeLines.forEach(function(l){map.removeLayer(l)});routeLines=[];
      var c=msg.coords.map(function(p){return[p.latitude,p.longitude]});
      if(c.length>1){
        routeLines.push(L.polyline(c,{color:'rgba(0,0,0,.15)',weight:8}).addTo(map));
        // ПРОМЕНЕНО: цветът на пътя вече е син (#3b82f6)
        routeLines.push(L.polyline(c,{color:'#3b82f6',weight:5}).addTo(map));
        if(msg.type==='route')map.fitBounds(routeLines[1].getBounds(),{padding:[40,40]});
      }
    }
    if(msg.type==='userPos'){userMarker.setLatLng([msg.lat,msg.lng]);}
    if(msg.type==='restorePin'){
      if(destMarker)map.removeLayer(destMarker);
      destMarker=L.marker([msg.lat,msg.lng],{icon:destIcon}).addTo(map);
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

// ── Component ─────────────────────────────────────────────────────
export default function MapPage() {
  const webViewRef = useRef(null);
  const panelAnim = useRef(new Animated.Value(0)).current;
  const stepListRef = useRef(null);
  const watcherRef = useRef(null);
  const routeCoordsRef = useRef([]);
  const destRef = useRef(null);
  const stepsRef = useRef([]);      // nav-only steps (DEPART filtered out)
  const lastRerouteRef = useRef(0);
  const isReroutingRef = useRef(false);

  const [location, setLocation] = useState(null);
  const [destination, setDest] = useState(null);
  const [steps, setSteps] = useState([]);   // nav-only steps
  const [summary, setSummary] = useState(null); // { distance, duration }
  const [phase, setPhase] = useState('locating');
  const [activeStep, setActiveStep] = useState(0);
  const [distToNext, setDistToNext] = useState(null);
  const [rerouting, setRerouting] = useState(false);

  // Resume snapshot
  const [savedRoute, setSavedRoute] = useState(null);
  const [canResume, setCanResume] = useState(false);

  // fetch navigation with backend
  const sendNavigationUpdate = async (dir, dist) => {
    try {
      await fetch(`${API_URL}/api/navigation/update/1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position: dir,
          distance: dist
        })
      });
    } catch (e) {
      console.log('Error sending navigation update', e);
    }
  };

  useEffect(() => {
    if (steps.length > 0 && activeStep < steps.length) {
      const step = steps[activeStep];
      const dir = BLE_DIR[step.type] || 'STRAIGHT';
      const dist = distToNext != null ? distToNext : Math.round(step.distance);
      sendNavigationUpdate(dir, dist);
    }
  }, [activeStep, distToNext, steps]);
  
  useEffect(() => { destRef.current = destination; }, [destination]);
  useEffect(() => { stepsRef.current = steps; }, [steps]);

  const slideIn = () => {
    panelAnim.setValue(0);
    Animated.spring(panelAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 12 }).start();
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission denied', 'Location access is needed.'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc.coords);
      setPhase('pinning');
    })();
    return () => stopWatcher();
  }, []);

  const stopWatcher = () => {
    if (watcherRef.current) { watcherRef.current.remove(); watcherRef.current = null; }
  };
  const startWatcher = async () => {
    stopWatcher();
    watcherRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 4, timeInterval: 2000 },
      (pos) => onPositionUpdate(pos.coords),
    );
  };

  const onPositionUpdate = (coords) => {
    const pos = { latitude: coords.latitude, longitude: coords.longitude };
    const dest = destRef.current;
    const allCoords = routeCoordsRef.current;
    const stepsSnap = stepsRef.current;

    webViewRef.current?.postMessage(JSON.stringify({ type: 'userPos', lat: pos.latitude, lng: pos.longitude }));
    if (!dest || allCoords.length === 0) return;

    if (haversine(pos, dest) < ARRIVE_RADIUS) {
      stopWatcher();
      sendNavigationUpdate('ARRIVE', 0);
      setPhase('arrived');
      return;
    }

    let nearestIdx = 0, nearestDist = Infinity;
    for (let i = 0; i < allCoords.length; i++) {
      const d = haversine(pos, allCoords[i]);
      if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
    }

    const now = Date.now();
    if (nearestDist > OFF_COURSE_DIST && !isReroutingRef.current && now - lastRerouteRef.current > REROUTE_COOLDOWN) {
      lastRerouteRef.current = now;
      rerouteSilent(pos, dest);
      return;
    }

    const remaining = allCoords.slice(nearestIdx);
    if (remaining.length > 1) {
      webViewRef.current?.postMessage(JSON.stringify({ type: 'trimRoute', coords: remaining }));
    }

    setActiveStep(prev => {
      let next = prev;
      while (next < stepsSnap.length - 1) {
        const step = stepsSnap[next];
        if (step.type === 11) break;
        const endCoord = allCoords[step?.way_points?.[1]];
        if (endCoord && haversine(pos, endCoord) < WAYPOINT_RADIUS) next++;
        else break;
      }
      const endCoord = allCoords[stepsSnap[next]?.way_points?.[1]];
      if (endCoord) setDistToNext(Math.round(haversine(pos, endCoord)));
      if (next !== prev && stepListRef.current) {
        stepListRef.current.scrollTo({ y: next * 68, animated: true });
      }
      return next;
    });
  };

  const rerouteSilent = async (fromPos, toDest) => {
    isReroutingRef.current = true;
    setRerouting(true);
    try {
      const url =
        `https://api.openrouteservice.org/v2/directions/wheelchair` +
        `?api_key=${ORS_API_KEY}` +
        `&start=${fromPos.longitude},${fromPos.latitude}` +
        `&end=${toDest.longitude},${toDest.latitude}`;
      const res = await fetch(url, { headers: { Accept: 'application/geo+json' } });
      const data = await res.json();
      if (!res.ok || !data.features?.length) return;
      const feature = data.features[0];
      const coords = feature.geometry.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
      const allRaw = feature.properties.segments.flatMap((s) => s.steps).filter(s => s.type !== 12);
      const navSteps = allRaw.filter((s, i) => !(s.type === 11 && i !== allRaw.length - 1));
      routeCoordsRef.current = coords;
      stepsRef.current = navSteps;
      setSteps(navSteps);
      setSummary({ distance: feature.properties.summary.distance, duration: feature.properties.summary.duration });
      setActiveStep(0); setDistToNext(null);
      webViewRef.current?.postMessage(JSON.stringify({ type: 'route', coords }));
      await startWatcher();
    } catch (_) { /* stay on old route */ } finally {
      isReroutingRef.current = false;
      setRerouting(false);
    }
  };

  const onMessage = (e) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'pin') {
        if ((phase === 'done' || phase === 'arrived') && stepsRef.current.length > 0) {
          setSavedRoute({ destination: destRef.current, steps: stepsRef.current, summary, coords: routeCoordsRef.current });
          setCanResume(true);
          stopWatcher();
        } else {
          setSavedRoute(null); setCanResume(false);
        }
        setDest({ latitude: msg.lat, longitude: msg.lng });
        setSteps([]); setSummary(null); setActiveStep(0); setDistToNext(null);
        setPhase('ready'); slideIn();
      }
    } catch { }
  };

  const resume = () => {
    if (!savedRoute) return;
    setDest(savedRoute.destination);
    setSteps(savedRoute.steps);
    stepsRef.current = savedRoute.steps;
    setSummary(savedRoute.summary);
    routeCoordsRef.current = savedRoute.coords;
    setActiveStep(0); setCanResume(false); setSavedRoute(null);
    setPhase('done'); slideIn();
    webViewRef.current?.postMessage(JSON.stringify({ type: 'route', coords: savedRoute.coords }));
    webViewRef.current?.postMessage(JSON.stringify({ type: 'restorePin', lat: savedRoute.destination.latitude, lng: savedRoute.destination.longitude }));
    startWatcher();
  };

  const fetchRoute = async () => {
    if (!destination) return;
    setPhase('routing');
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc.coords);
      const url =
        `https://api.openrouteservice.org/v2/directions/wheelchair` +
        `?api_key=${ORS_API_KEY}` +
        `&start=${loc.coords.longitude},${loc.coords.latitude}` +
        `&end=${destination.longitude},${destination.latitude}`;
      const res = await fetch(url, { headers: { Accept: 'application/geo+json' } });
      const data = await res.json();
      if (!res.ok || !data.features?.length) {
        Alert.alert('No route found', data.error?.message || 'No wheelchair route available.');
        setPhase('ready'); return;
      }
      const feature = data.features[0];
      const coords = feature.geometry.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));

      const allRaw = feature.properties.segments.flatMap((s) => s.steps).filter(s => s.type !== 12);
      const navSteps = allRaw.filter((s, i) => !(s.type === 11 && i !== allRaw.length - 1));

      routeCoordsRef.current = coords;
      stepsRef.current = navSteps;
      setSteps(navSteps);
      setSummary({ distance: feature.properties.summary.distance, duration: feature.properties.summary.duration });
      setActiveStep(0); setDistToNext(null);
      setSavedRoute(null); setCanResume(false);
      lastRerouteRef.current = 0;
      setPhase('done'); slideIn();
      webViewRef.current?.postMessage(JSON.stringify({ type: 'route', coords }));
      startWatcher();
    } catch (err) {
      Alert.alert('Error', err.message); setPhase('ready');
    }
  };

  const reset = () => {
    stopWatcher();
    sendNavigationUpdate('ARRIVE', -1); // !!! - to stop hardware display
    setDest(null); setSteps([]); setSummary(null);
    setActiveStep(0); setDistToNext(null); setRerouting(false);
    setSavedRoute(null); setCanResume(false);
    routeCoordsRef.current = []; stepsRef.current = [];
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
          source={{
            html: buildMapHTML(location.latitude, location.longitude),
            baseUrl: 'https://openstreetmap.org'
          }}
          userAgent="Legendss_HackTUES12_App/1.0 (Hackathon Project)"
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={s.placeholder}><ActivityIndicator size="large" color="#2473c8" /></View>
          )}
        />
      ) : (
        <View style={s.placeholder}>
          <ActivityIndicator size="large" color="#2480c6" />
          <Text style={s.muted}>Locating you…</Text>
        </View>
      )}

      {phase === 'pinning' && (
        <View style={s.hint} pointerEvents="none">
          <Text style={s.hintText}>Tap the map to pin your destination</Text>
        </View>
      )}

      {rerouting && (
        <View style={s.rerouteToast} pointerEvents="none">
          <ActivityIndicator size="small" color="#f59e0b" style={{ marginRight: 8 }} />
          <Text style={s.rerouteTxt}>Rerouting…</Text>
        </View>
      )}

      {/* ARRIVED OVERLAY */}
      {phase === 'arrived' && (
        <View style={s.arrivedOverlay}>
          <Text style={s.arrivedEmoji}>🏁</Text>
          <Text style={s.arrivedTitle}>You have arrived!</Text>
          <Text style={s.arrivedSub}>You have reached your destination.</Text>
          <TouchableOpacity style={s.arrivedBtn} onPress={reset}>
            <Text style={s.arrivedBtnTxt}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* BOTTOM PANEL */}
      {(phase === 'ready' || phase === 'routing' || phase === 'done') && (
        <Animated.View style={[s.panel, { transform: [{ translateY: panelAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) }] }]}>

          {/* READY */}
          {phase === 'ready' && destination && (
            <>
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>Where to?</Text>
                  <Text style={s.sub}>{destination.latitude.toFixed(5)}, {destination.longitude.toFixed(5)}</Text>
                </View>
                <View style={s.headerActions}>
                  {canResume && (
                    <TouchableOpacity onPress={resume} style={s.resumeBtn}>
                      <Text style={s.resumeTxt}>← Resume</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={reset} style={s.closeBtn}>
                    <Text style={s.closeTxt}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={s.goBtn} onPress={fetchRoute} activeOpacity={0.85}>
                <Text style={s.goBtnTxt}>Get Wheelchair Route</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ROUTING */}
          {phase === 'routing' && (
            <View style={s.centered}>
              <ActivityIndicator size="large" color="#2581cd" />
              <Text style={s.muted}>Finding accessible route…</Text>
            </View>
          )}

          {/* DONE — live directions */}
          {phase === 'done' && steps.length > 0 && (
            <>
              {steps[activeStep] && (
                <View style={s.heroCard}>
                  <Text style={s.heroArrow}>{STEP_ARROW[steps[activeStep].type] ?? '→'}</Text>
                  <View style={s.heroMid}>
                    <Text style={s.heroLabel}>
                      {STEP_LABEL[steps[activeStep].type] ?? 'CONTINUE'}
                    </Text>
                  </View>
                  <View style={s.heroDistCol}>
                    <Text style={s.heroDistNum}>
                      {distToNext != null ? distToNext : Math.round(steps[activeStep].distance)}
                    </Text>
                    <Text style={s.heroDistUnit}>m</Text>
                  </View>
                </View>
              )}

              <View style={s.dividerRow}>
                <View style={s.divider} />
                <Text style={s.stepCount}>
                  {activeStep + 1}/{steps.length}
                  {summary ? `  ·  ${formatETA(summary.duration)}` : ''}
                  {summary ? `  ·  ${formatDist(summary.distance)}` : ''}
                </Text>
                <View style={s.divider} />
              </View>

              <ScrollView ref={stepListRef} style={s.list} showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 8 }}>
                {steps.map((step, i) => {
                  const isActive = i === activeStep;
                  const isDone = i < activeStep;
                  return (
                    <View key={i} style={[s.stepRow, isActive && s.stepRowActive, isDone && s.stepRowDone, i === steps.length - 1 && { borderBottomWidth: 0 }]}>
                      <View style={[s.badge, isActive && s.badgeActive, step.type === 11 && s.badgeArrive]}>
                        <Text style={[s.arrow, isDone && { opacity: 0.3 }]}>{STEP_ARROW[step.type] ?? '→'}</Text>
                      </View>
                      <View style={s.stepMid}>
                        <Text style={[s.stepLabel, isDone && { color: '#374151' }, isActive && { color: '#2581cd' }]}>
                          {STEP_LABEL[step.type] ?? 'CONTINUE'}
                        </Text>
                      </View>
                      <View style={s.chip}>
                        <Text style={[s.chipTxt, isDone && { color: '#374151' }]}>{formatDist(step.distance)}</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              <TouchableOpacity onPress={reset} style={s.resetBtn}>
                <Text style={s.resetTxt}>✕  End Navigation</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a' },
  map: { flex: 1 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111', gap: 14 },
  muted: { color: '#6b7280', fontSize: 14 },

  hint: {
    position: 'absolute', top: 52, alignSelf: 'center',
    backgroundColor: 'rgba(10,10,10,0.82)', paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  hintText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  rerouteToast: {
    position: 'absolute', top: 52, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(10,10,10,0.88)', paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 30, borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)',
  },
  rerouteTxt: { color: '#f59e0b', fontSize: 13, fontWeight: '700' },

  arrivedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.92)',
    alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 99,
  },
  arrivedEmoji: { fontSize: 64 },
  arrivedTitle: { color: '#f9fafb', fontSize: 26, fontWeight: '800' },
  arrivedSub: { color: '#6b7280', fontSize: 14 },
  arrivedBtn: { marginTop: 8, backgroundColor: '#2581cd', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 14 },
  arrivedBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },

  panel: {
    backgroundColor: '#111827', borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16,
    maxHeight: SCREEN_HEIGHT * 0.52, minHeight: 400,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 20,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: '#f9fafb', fontSize: 18, fontWeight: '700' },
  sub: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  closeBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  closeTxt: { color: '#6b7280', fontWeight: '600', fontSize: 14 },

  resumeBtn: {
    // ПРОМЕНЕНО
    backgroundColor: 'rgba(59,130,246,0.15)', borderWidth: 1,
    borderColor: '#2581cd', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  resumeTxt: { color: '#2581cd', fontWeight: '700', fontSize: 13 },

  goBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2581cd', borderRadius: 14, paddingVertical: 15,
    shadowColor: '#2581cd', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
  },
  goBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },

  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24, gap: 12 },

  heroCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1f2937', borderRadius: 16,
    padding: 14, marginBottom: 10, gap: 12,
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.25)',
  },
  heroArrow: { fontSize: 36, width: 48, textAlign: 'center' },
  heroMid: { flex: 1 },
  heroLabel: { color: '#f9fafb', fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  heroDistCol: { alignItems: 'flex-end' },
  heroDistNum: { color: '#f9fafb', fontSize: 26, fontWeight: '800' },
  heroDistUnit: { color: '#6b7280', fontSize: 12, marginTop: -2 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  divider: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  stepCount: { color: '#4b5563', fontSize: 11, fontWeight: '600' },

  list: { flex: 1 },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', gap: 12,
  },
  stepRowActive: { opacity: 1 },
  stepRowDone: { opacity: 0.35 },

  badge: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  // ПРОМЕНЕНО
  badgeActive: { backgroundColor: 'rgba(59,130,246,0.2)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.4)' },
  badgeArrive: { backgroundColor: 'rgba(59,130,246,0.15)' },
  arrow: { fontSize: 17 },
  stepMid: { flex: 1 },
  stepLabel: { color: '#9ca3af', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  chip: { backgroundColor: '#1f2937', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, flexShrink: 0 },
  chipTxt: { color: '#9ca3af', fontSize: 11, fontWeight: '700' },

  resetBtn: {
    marginTop: 10, alignItems: 'center', paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  resetTxt: { color: '#ef4444', fontWeight: '700', fontSize: 13 },
});