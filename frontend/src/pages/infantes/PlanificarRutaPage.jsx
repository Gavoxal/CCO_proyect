import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Paper, Stack, Checkbox, List, ListItem, ListItemButton,
    ListItemIcon, ListItemText, ListItemAvatar, Avatar, CircularProgress,
    FormControl, FormControlLabel, Radio, RadioGroup, Alert, Chip, TextField, Switch, InputAdornment,
    Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, Divider
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Map as MapIcon,
    DirectionsCar as CarIcon,
    LocationOn as LocationIcon,
    MyLocation as MyLocationIcon,
    Route as RouteIcon,
    People as PeopleIcon,
    Search as SearchIcon,
    PlayArrow as PlayIcon,
    Stop as StopIcon,
    AssignmentTurnedIn as FinishIcon,
    SettingsSuggest as OptimizeIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import MainLayout from '../../components/layout/MainLayout';
import { infantesService } from '../../services/appServices';
import { useAuth } from '../../context/AuthContext';

// Fix Leaflet Default Icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Iglesia Coordinates
const CHURCH_LOCATION = { lat: -3.9980611920080356, lng: -79.22219517276648 };
const MAX_STOPS = 10;

// OSRM Public Server API
const OSRM_URL = 'https://router.project-osrm.org/trip/v1/driving';

// Custom Map Icons
const createNumberedIcon = (number, color = '#2196f3') => {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${number}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
};

const MapUpdater = ({ livePosition, isNavigating }) => {
    const map = useMap();
    useEffect(() => {
        if (isNavigating && livePosition) {
            map.flyTo([livePosition.lat, livePosition.lng], 17, { animate: true });
        }
    }, [livePosition, isNavigating, map]);
    return null;
};

const PlanificarRutaPage = () => {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [infantes, setInfantes] = useState([]);
    
    // Tab State
    const [activeTab, setActiveTab] = useState(0); // 0: Manual, 1: Lotes

    // General Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [showOnlyMine, setShowOnlyMine] = useState(false);
    
    // Step 1: Options
    const [originType, setOriginType] = useState('church'); // 'church' | 'current'
    const [currentLocation, setCurrentLocation] = useState(null);
    
    // Modo Manual: Selection
    const [selectedIds, setSelectedIds] = useState([]);
    
    // Modo Lote: Pool & Quota
    const [poolIds, setPoolIds] = useState(() => {
        const saved = localStorage.getItem('ruta_pool_ids');
        return saved ? JSON.parse(saved) : [];
    });
    const [quota, setQuota] = useState(5);

    // Route calculation & tracking
    const [calculating, setCalculating] = useState(false);
    const [routeData, setRouteData] = useState(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const [livePosition, setLivePosition] = useState(null);
    const watchIdRef = useRef(null);

    // Modal de Finalización
    const [finishModalOpen, setFinishModalOpen] = useState(false);
    const [successfulVisits, setSuccessfulVisits] = useState([]);

    useEffect(() => {
        cargarInfantes();
    }, []);

    useEffect(() => {
        localStorage.setItem('ruta_pool_ids', JSON.stringify(poolIds));
    }, [poolIds]);

    const cargarInfantes = async () => {
        try {
            setLoading(true);
            const res = await infantesService.listar({ limit: 500 });
            const data = res.data || [];
            
            // Filter only infantes with valid GPS location
            const infantesConGps = data.filter(inf => {
                const gps = inf.persona?.ubicacionGps;
                if (!gps) return false;
                const parts = gps.split(',');
                if (parts.length !== 2) return false;
                const lat = parseFloat(parts[0]);
                const lng = parseFloat(parts[1]);
                return !isNaN(lat) && !isNaN(lng);
            });

            // Map and parse coordinates
            const parsedInfantes = infantesConGps.map(inf => {
                const parts = inf.persona.ubicacionGps.split(',');
                return {
                    ...inf,
                    parsedGps: {
                        lat: parseFloat(parts[0]),
                        lng: parseFloat(parts[1])
                    }
                };
            });

            setInfantes(parsedInfantes);
        } catch (error) {
            console.error(error);
            enqueueSnackbar('Error al cargar la lista de infantes.', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const filteredInfantes = useMemo(() => {
        return infantes.filter(infante => {
            if (showOnlyMine && infante.tutorId !== user?.persona?.tutor?.id) {
                return false;
            }
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const nombreCompleto = `${infante.persona?.nombres || ''} ${infante.persona?.apellidos || ''}`.toLowerCase();
                const codigo = (infante.codigo || '').toLowerCase();
                if (!nombreCompleto.includes(term) && !codigo.includes(term)) {
                    return false;
                }
            }
            return true;
        });
    }, [infantes, searchTerm, showOnlyMine, user]);

    // Handle Manual Toggles
    const handleToggle = (value) => () => {
        const currentIndex = selectedIds.indexOf(value);
        const newChecked = [...selectedIds];

        if (currentIndex === -1) {
            if (newChecked.length >= MAX_STOPS) {
                enqueueSnackbar(`Puedes seleccionar un máximo de ${MAX_STOPS} infantes a la vez.`, { variant: 'warning' });
                return;
            }
            newChecked.push(value);
        } else {
            newChecked.splice(currentIndex, 1);
        }

        setSelectedIds(newChecked);
        setRouteData(null); 
    };

    // Handle Pool Toggles
    const handlePoolToggle = (value) => () => {
        const currentIndex = poolIds.indexOf(value);
        const newPool = [...poolIds];
        if (currentIndex === -1) {
            newPool.push(value);
        } else {
            newPool.splice(currentIndex, 1);
        }
        setPoolIds(newPool);
        setRouteData(null);
    };

    const requestLocation = () => {
        if (!navigator.geolocation) {
            enqueueSnackbar('Geolocalización no soportada por el navegador.', { variant: 'error' });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setOriginType('current');
                enqueueSnackbar('Ubicación obtenida exitosamente.', { variant: 'success' });
            },
            (err) => {
                enqueueSnackbar('Error obteniendo ubicación. Asegúrate de dar permisos.', { variant: 'error' });
                setOriginType('church');
            }
        );
    };

    const handleOriginChange = (e) => {
        const val = e.target.value;
        if (val === 'current' && !currentLocation) {
            requestLocation();
        } else {
            setOriginType(val);
        }
    };

    // Algoritmo Avaro para Seleccionar Lote
    const getDistance = (p1, p2) => {
        const R = 6371; // Radio de la Tierra en km
        const dLat = (p2.lat - p1.lat) * Math.PI / 180;
        const dLon = (p2.lng - p1.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    const calcularRutaGreedy = (startCoords) => {
        const unvisited = poolIds.map(id => infantes.find(i => i.id === id)).filter(Boolean);
        if (unvisited.length === 0) return [];
        
        let currentPos = startCoords;
        let selectedForRoute = [];
        let limit = Math.min(quota, MAX_STOPS, unvisited.length);

        while (selectedForRoute.length < limit && unvisited.length > 0) {
            let closest = null;
            let minDistance = Infinity;
            let closestIndex = -1;

            for (let i = 0; i < unvisited.length; i++) {
                const inf = unvisited[i];
                const dist = getDistance(currentPos, inf.parsedGps);
                if (dist < minDistance) {
                    minDistance = dist;
                    closest = inf;
                    closestIndex = i;
                }
            }

            if (closest) {
                selectedForRoute.push(closest);
                currentPos = closest.parsedGps;
                unvisited.splice(closestIndex, 1);
            }
        }
        return selectedForRoute;
    };

    const generarRuta = async () => {
        const startCoords = originType === 'church' ? CHURCH_LOCATION : currentLocation;
        if (!startCoords) {
            enqueueSnackbar('No hay punto de inicio válido.', { variant: 'error' });
            return;
        }

        let selectedInfantes = [];
        if (activeTab === 0) {
            if (selectedIds.length === 0) {
                enqueueSnackbar('Selecciona al menos un infante.', { variant: 'warning' });
                return;
            }
            selectedInfantes = infantes.filter(i => selectedIds.includes(i.id));
        } else {
            if (poolIds.length === 0) {
                enqueueSnackbar('Añade infantes a tu bolsa de visitas primero.', { variant: 'warning' });
                return;
            }
            selectedInfantes = calcularRutaGreedy(startCoords);
            // Auto update manual selection to reflect what the algorithm picked so the UI aligns
            setSelectedIds(selectedInfantes.map(i => i.id));
        }

        setCalculating(true);
        try {
            const startStr = `${startCoords.lng},${startCoords.lat}`;
            const waypointsStr = selectedInfantes.map(inf => `${inf.parsedGps.lng},${inf.parsedGps.lat}`).join(';');
            
            const coordinatesStr = `${startStr};${waypointsStr}`;
            
            // source=first ensures the starting point is fixed. destination=any optimizes all other points.
            const url = `${OSRM_URL}/${coordinatesStr}?roundtrip=false&source=first&destination=any&geometries=geojson&steps=false`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.code !== 'Ok') {
                throw new Error(data.message || 'Error en la API de OSRM');
            }

            const trip = data.trips[0];
            const routeCoordinates = trip.geometry.coordinates.map(coord => [coord[1], coord[0]]); 
            
            const waypoints = data.waypoints.sort((a, b) => a.waypoint_index - b.waypoint_index);
            
            const optimizedStops = waypoints.map((wp, index) => {
                if (index === 0) {
                    return { type: 'start', label: originType === 'church' ? 'Iglesia (Inicio)' : 'Mi Ubicación (Inicio)', coords: [wp.location[1], wp.location[0]] };
                }
                const originalIndex = data.waypoints.findIndex(origWp => origWp.waypoint_index === index);
                const infante = selectedInfantes[originalIndex - 1]; 
                
                return {
                    type: 'stop',
                    infante,
                    label: infante ? `${infante.persona.nombres} ${infante.persona.apellidos}` : 'Desconocido',
                    coords: [wp.location[1], wp.location[0]]
                };
            });

            setRouteData({
                distance: (trip.distance / 1000).toFixed(2), // km
                duration: Math.round(trip.duration / 60), // minutes
                polyline: routeCoordinates,
                stops: optimizedStops
            });
            
            enqueueSnackbar(activeTab === 1 ? 'Ruta generada usando el clúster óptimo.' : 'Ruta calculada y optimizada exitosamente.', { variant: 'success' });

        } catch (error) {
            console.error(error);
            enqueueSnackbar('No se pudo generar la ruta. Intente más tarde.', { variant: 'error' });
        } finally {
            setCalculating(false);
        }
    };

    // Tracking / Navegacion
    const toggleNavigation = () => {
        if (isNavigating) {
            // Stop
            setIsNavigating(false);
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            setLivePosition(null);
            enqueueSnackbar('Navegación detenida', { variant: 'info' });
        } else {
            // Start
            if (!navigator.geolocation) {
                enqueueSnackbar('Geolocalización no soportada.', { variant: 'error' });
                return;
            }
            setIsNavigating(true);
            watchIdRef.current = navigator.geolocation.watchPosition(
                (pos) => {
                    setLivePosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                (err) => {
                    console.error(err);
                    enqueueSnackbar('GPS perdido o denegado.', { variant: 'error' });
                },
                { enableHighAccuracy: true }
            );
            enqueueSnackbar('Navegación iniciada', { variant: 'success' });
        }
    };

    const openFinishModal = () => {
        // Preseleccionar todos los niños de la ruta generada
        const routeInfanteIds = routeData.stops.filter(s => s.type === 'stop').map(s => s.infante.id);
        setSuccessfulVisits(routeInfanteIds);
        setFinishModalOpen(true);
    };

    const confirmFinishRoute = () => {
        // Si estamos en modo lotes, restamos de la bolsa global los visitados exitosamente
        if (activeTab === 1) {
            const newPool = poolIds.filter(id => !successfulVisits.includes(id));
            setPoolIds(newPool);
        }
        
        // Reset everything
        setRouteData(null);
        setSelectedIds([]); 
        setFinishModalOpen(false);
        if (isNavigating) toggleNavigation();
        
        enqueueSnackbar('Ruta finalizada. Registros de la bolsa actualizados.', { variant: 'success' });
    };

    const mapBounds = useMemo(() => {
        if (!routeData || routeData.stops.length === 0) return null;
        const lats = routeData.stops.map(s => s.coords[0]);
        const lngs = routeData.stops.map(s => s.coords[1]);
        return [
            [Math.min(...lats), Math.min(...lngs)],
            [Math.max(...lats), Math.max(...lngs)]
        ];
    }, [routeData]);

    return (
        <MainLayout title="Planificar Ruta" subtitle="Optimiza tu ruta de visitas a los infantes">
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mt: 2 }}>
                
                {/* Panel Izquierdo: Controles */}
                <Box sx={{ width: { xs: '100%', md: '35%' }, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    
                    {/* Tarjeta 1: Opciones Base */}
                    <Paper sx={{ p: 3, borderRadius: 4 }}>
                        <Typography variant="h6" fontWeight={700} mb={2} display="flex" alignItems="center" gap={1}>
                            <LocationIcon color="primary" /> 1. Punto de Partida
                        </Typography>
                        <FormControl component="fieldset" fullWidth>
                            <RadioGroup value={originType} onChange={handleOriginChange}>
                                <FormControlLabel 
                                    value="church" 
                                    control={<Radio />} 
                                    label={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Iglesia CCO</span>} 
                                />
                                <FormControlLabel 
                                    value="current" 
                                    control={<Radio />} 
                                    label={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MyLocationIcon fontSize="small"/> Mi Ubicación Actual</span>} 
                                />
                            </RadioGroup>
                        </FormControl>
                        {originType === 'current' && !currentLocation && (
                            <Alert severity="warning" sx={{ mt: 1 }}>Esperando ubicación...</Alert>
                        )}
                    </Paper>

                    {/* Tarjeta 2: Selección y Bolsa */}
                    <Paper sx={{ borderRadius: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <Tabs 
                            value={activeTab} 
                            onChange={(e, val) => { setActiveTab(val); setRouteData(null); }} 
                            variant="fullWidth" 
                            indicatorColor="primary"
                            textColor="primary"
                        >
                            <Tab label="Ruta Manual" />
                            <Tab label="Campaña / Lotes" />
                        </Tabs>

                        <Box p={3} flexGrow={1} display="flex" flexDirection="column">
                            <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Buscar infante..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon color="action" fontSize="small" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                {user?.rol && ['tutor', 'tutor_especial'].includes(user.rol) && (
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={showOnlyMine}
                                                onChange={(e) => setShowOnlyMine(e.target.checked)}
                                                color="primary"
                                            />
                                        }
                                        label="Mostrar solo mis infantes asignados"
                                    />
                                )}
                            </Box>

                            {/* Contenido según Tab */}
                            {activeTab === 0 ? (
                                <>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Selecciona los infantes específicos para visitar hoy.
                                        </Typography>
                                        <Chip label={`${selectedIds.length}/${MAX_STOPS}`} color={selectedIds.length === MAX_STOPS ? "warning" : "primary"} size="small" />
                                    </Box>
                                    <List sx={{ width: '100%', bgcolor: 'background.paper', maxHeight: 300, overflow: 'auto', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                        {loading ? <CircularProgress sx={{ m: 2 }} /> : filteredInfantes.map((infante) => (
                                            <ListItem key={infante.id} disablePadding>
                                                <ListItemButton onClick={handleToggle(infante.id)} dense>
                                                    <ListItemIcon>
                                                        <Checkbox edge="start" checked={selectedIds.includes(infante.id)} disableRipple />
                                                    </ListItemIcon>
                                                    <ListItemText 
                                                        primary={`[${infante.codigo}] ${infante.persona.nombres} ${infante.persona.apellidos}`} 
                                                        secondary={`Tutor: ${infante.tutor?.persona?.nombres || 'Sin tutor'}`} 
                                                    />
                                                </ListItemButton>
                                            </ListItem>
                                        ))}
                                    </List>
                                </>
                            ) : (
                                <>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Agrega infantes a tu bolsa (ej. para cartas). 
                                        </Typography>
                                        <Chip label={`En bolsa: ${poolIds.length}`} color="secondary" size="small" />
                                    </Box>
                                    
                                    <TextField
                                        label="Infantes a visitar hoy (Cuota)"
                                        type="number"
                                        size="small"
                                        value={quota}
                                        onChange={(e) => setQuota(Math.min(MAX_STOPS, Math.max(1, parseInt(e.target.value) || 1)))}
                                        fullWidth
                                        sx={{ mb: 2 }}
                                        helperText={`Máximo ${MAX_STOPS} permitidos por la API`}
                                    />

                                    <List sx={{ width: '100%', bgcolor: 'background.paper', maxHeight: 230, overflow: 'auto', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                        {loading ? <CircularProgress sx={{ m: 2 }} /> : filteredInfantes.map((infante) => (
                                            <ListItem key={infante.id} disablePadding>
                                                <ListItemButton onClick={handlePoolToggle(infante.id)} dense>
                                                    <ListItemIcon>
                                                        <Checkbox edge="start" checked={poolIds.includes(infante.id)} disableRipple />
                                                    </ListItemIcon>
                                                    <ListItemText 
                                                        primary={`[${infante.codigo}] ${infante.persona.nombres} ${infante.persona.apellidos}`} 
                                                        secondary={`Tutor: ${infante.tutor?.persona?.nombres || 'Sin tutor'}`} 
                                                    />
                                                </ListItemButton>
                                            </ListItem>
                                        ))}
                                    </List>
                                </>
                            )}

                            <Button 
                                variant="contained" 
                                color="primary" 
                                fullWidth 
                                size="large"
                                sx={{ mt: 3, borderRadius: 3, py: 1.5, fontWeight: 'bold' }}
                                startIcon={calculating ? <CircularProgress size={20} color="inherit" /> : (activeTab === 1 ? <OptimizeIcon /> : <RouteIcon />)}
                                onClick={generarRuta}
                                disabled={calculating || (activeTab === 0 && selectedIds.length === 0) || (activeTab === 1 && poolIds.length === 0) || (originType === 'current' && !currentLocation)}
                            >
                                {calculating ? 'Optimizando...' : (activeTab === 1 ? 'Generar Ruta Automática' : 'Generar Ruta Óptima')}
                            </Button>
                        </Box>
                    </Paper>
                </Box>

                {/* Panel Derecho: Mapa y Resultados */}
                <Box sx={{ width: { xs: '100%', md: '65%' }, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Paper sx={{ p: 2, borderRadius: 4, flexGrow: 1, minHeight: 600, display: 'flex', flexDirection: 'column' }}>
                        
                        {!routeData ? (
                            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" color="text.secondary">
                                <MapIcon sx={{ fontSize: 80, opacity: 0.2, mb: 2 }} />
                                <Typography variant="h6">Configura y genera tu ruta</Typography>
                                <Typography variant="body2">El mapa se mostrará aquí una vez que calcules la ruta óptima.</Typography>
                            </Box>
                        ) : (
                            <>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
                                    <Typography variant="h6" fontWeight={700}>
                                        Ruta Sugerida
                                    </Typography>
                                    <Stack direction="row" spacing={2}>
                                        <Chip icon={<RouteIcon />} label={`${routeData.distance} km`} color="secondary" variant="outlined" />
                                        <Chip icon={<CarIcon />} label={`~${routeData.duration} min de manejo`} color="primary" />
                                        
                                        {!isNavigating ? (
                                            <Button variant="contained" color="success" size="small" startIcon={<PlayIcon/>} onClick={toggleNavigation}>
                                                Navegar
                                            </Button>
                                        ) : (
                                            <Button variant="contained" color="error" size="small" startIcon={<StopIcon/>} onClick={toggleNavigation}>
                                                Detener
                                            </Button>
                                        )}
                                        
                                        <Button variant="contained" color="info" size="small" startIcon={<FinishIcon/>} onClick={openFinishModal}>
                                            Finalizar
                                        </Button>
                                    </Stack>
                                </Box>
                                
                                <Box sx={{ flexGrow: 1, borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', mb: 2, position: 'relative' }}>
                                    <MapContainer 
                                        bounds={mapBounds} 
                                        style={{ height: '100%', width: '100%', minHeight: 400 }}
                                        scrollWheelZoom={true}
                                    >
                                        <TileLayer
                                            attribution='&copy; OpenStreetMap'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        
                                        <Polyline positions={routeData.polyline} color="#2196f3" weight={5} opacity={0.8} />

                                        {routeData.stops.map((stop, i) => (
                                            <Marker 
                                                key={i} 
                                                position={stop.coords}
                                                icon={stop.type === 'start' ? createNumberedIcon('S', '#4caf50') : createNumberedIcon(i, '#f44336')}
                                            >
                                                <Popup>
                                                    <Typography variant="subtitle2" fontWeight="bold">
                                                        {i === 0 ? 'Punto de Inicio' : `Parada ${i}`}
                                                    </Typography>
                                                    <Typography variant="body2">{stop.label}</Typography>
                                                </Popup>
                                            </Marker>
                                        ))}

                                        {/* Marcador de posición GPS en vivo */}
                                        {isNavigating && livePosition && (
                                            <Marker 
                                                position={[livePosition.lat, livePosition.lng]}
                                                icon={L.divIcon({
                                                    className: 'custom-div-icon',
                                                    html: `<div style="background-color: #2196f3; border-radius: 50%; width: 16px; height: 16px; border: 3px solid white; box-shadow: 0 0 10px rgba(33,150,243,0.8);"></div>`,
                                                    iconSize: [16, 16],
                                                    iconAnchor: [8, 8]
                                                })}
                                            >
                                                <Popup>Tu ubicación actual</Popup>
                                            </Marker>
                                        )}

                                        <MapUpdater livePosition={livePosition} isNavigating={isNavigating} />

                                    </MapContainer>
                                </Box>

                                <Typography variant="subtitle1" fontWeight={700} mb={1}>Orden de Visita</Typography>
                                <List dense sx={{ display: 'flex', flexDirection: 'row', overflowX: 'auto', p: 0, gap: 1 }}>
                                    {routeData.stops.map((stop, i) => (
                                        <Paper key={i} variant="outlined" sx={{ minWidth: 200, p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar sx={{ bgcolor: i === 0 ? 'success.main' : 'error.main', width: 32, height: 32, fontSize: '1rem' }}>
                                                {i === 0 ? 'S' : i}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold" noWrap sx={{ maxWidth: 140 }}>
                                                    {i === 0 ? 'Inicio' : stop.label}
                                                </Typography>
                                                {i !== 0 && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {stop.infante?.tutor?.persona?.nombres || 'Sin tutor'}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Paper>
                                    ))}
                                </List>
                            </>
                        )}
                    </Paper>
                </Box>
            </Stack>

            {/* Modal de Finalización */}
            <Dialog open={finishModalOpen} onClose={() => setFinishModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Confirmar Visitas Realizadas</DialogTitle>
                <DialogContent dividers>
                    <Typography mb={2} color="text.secondary">
                        Selecciona los infantes que visitaste exitosamente durante esta ruta. 
                        {activeTab === 1 && " Los que marques se eliminarán de tu bolsa de pendientes."}
                    </Typography>
                    <List>
                        {routeData?.stops.filter(s => s.type === 'stop').map((stop, i) => (
                            <ListItem key={stop.infante.id} disablePadding>
                                <ListItemButton dense onClick={() => {
                                    if (successfulVisits.includes(stop.infante.id)) {
                                        setSuccessfulVisits(successfulVisits.filter(id => id !== stop.infante.id));
                                    } else {
                                        setSuccessfulVisits([...successfulVisits, stop.infante.id]);
                                    }
                                }}>
                                    <ListItemIcon>
                                        <Checkbox 
                                            edge="start" 
                                            checked={successfulVisits.includes(stop.infante.id)} 
                                            disableRipple 
                                        />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={`Parada ${i+1}: [${stop.infante.codigo}] ${stop.infante.persona.nombres} ${stop.infante.persona.apellidos}`} 
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFinishModalOpen(false)}>Cancelar</Button>
                    <Button variant="contained" color="primary" onClick={confirmFinishRoute}>
                        Confirmar y Finalizar
                    </Button>
                </DialogActions>
            </Dialog>

        </MainLayout>
    );
};

export default PlanificarRutaPage;
