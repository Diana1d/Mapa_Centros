// Variables globales
let map;
let boliviaLayer;
let centrosLayer;
let allCentros = [];
let routingControl = null;

// Inicialización del mapa
function initMap() {
    // Crear mapa centrado en Bolivia
    map = L.map('map').setView([-16.5, -64.5], 6);
    
    // Añadir capa base (usando OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // En initMap(), después de añadir la capa base de OSM:
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    // Añadir control de capas base
    const baseLayers = {
        "Mapa": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }),
        "Satélite": satelliteLayer
    };

    L.control.layers(baseLayers).addTo(map);

    // En la función initMap(), después de crear el mapa:
    L.control.zoom({
        position: 'topright',
        zoomInText: '+',
        zoomInTitle: 'Acercar',
        zoomOutText: '-',
        zoomOutTitle: 'Alejar'
    }).addTo(map);
    
    // Cargar GeoJSON de Bolivia
    fetch('data/bo.json')
        .then(response => response.json())
        .then(data => {
            boliviaLayer = L.geoJSON(data, {
                style: {
                    fillColor: '#f8f9fa',
                    weight: 2,
                    opacity: 1,
                    color: '#6c757d',
                    fillOpacity: 0.7
                }
            }).addTo(map);
        });
    
    // Cargar datos de centros científicos
    loadCentros();
    
    // Configurar eventos
    document.getElementById('search-btn').addEventListener('click', searchCentro);
    document.getElementById('filter-type').addEventListener('change', filterCentros);
    document.getElementById('close-panel').addEventListener('click', closeInfoPanel);
    
    // Manejar responsive
    window.addEventListener('resize', handleResize);
}

// En initMap():
function addLocateControl() {
    const locateControl = L.control.locate({
        position: 'topright',
        drawCircle: true,
        follow: true,
        setView: 'untilPanOrZoom',
        keepCurrentZoomLevel: true,
        markerStyle: {
            weight: 1,
            opacity: 0.8,
            fillOpacity: 0.8
        },
        circleStyle: {
            weight: 1,
            clickable: false
        },
        icon: 'fa fa-map-marker-alt',
        metric: true,
        strings: {
            title: "Mostrar mi ubicación",
            popup: "Estás dentro de {distance} {unit} de este punto",
            outsideMapBoundsMsg: "Parece que estás fuera de los límites del mapa"
        },
        locateOptions: {
            maxZoom: 16,
            watch: true,
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 10000
        }
    }).addTo(map);
    
    // Necesitarás incluir la librería Leaflet.Locate en tu HTML

    // Agrega estos al final de la función
    addLocateControl();
    addRoutingControl();
    
    // Controles de zoom personalizados
    L.control.zoom({
        position: 'topright',
        zoomInText: '+',
        zoomInTitle: 'Acercar',
        zoomOutText: '-',
        zoomOutTitle: 'Alejar'
    }).addTo(map);
    
    // Capa de mapa satelital
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });
    
    const baseLayers = {
        "Mapa": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }),
        "Satélite": satelliteLayer
    };
    
    L.control.layers(baseLayers).addTo(map);
}

// Cargar datos de centros científicos
function loadCentros() {
    fetch('geojson.php?action=get_centros')
        .then(response => response.json())
        .then(data => {
            allCentros = data;
            updateCentrosLayer(allCentros);
        });
}

// Actualizar capa de centros en el mapa
function updateCentrosLayer(centros) {
    if (centrosLayer) {
        map.removeLayer(centrosLayer);
    }
    
    // Definir iconos personalizados
    const iconConfig = {
        'observatorio': {
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/2909/2909553.png',
            iconSize: [30, 30]
        },
        'planetario': {
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/2909/2909548.png',
            iconSize: [30, 30]
        },
        'museo': {
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/2909/2909523.png',
            iconSize: [30, 30]
        },
        'universidad': {
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/2909/2909519.png',
            iconSize: [30, 30]
        },
        'club': {
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/2909/2909504.png',
            iconSize: [30, 30]
        },
        'default': {
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/447/447031.png',
            iconSize: [25, 41]
        }
    };
    
    centrosLayer = L.geoJSON(centros, {
        pointToLayer: function(feature, latlng) {
            // Obtener configuración del icono según el tipo
            const config = iconConfig[feature.properties.tipo] || iconConfig.default;
            
            const icon = L.icon({
                iconUrl: config.iconUrl,
                iconSize: config.iconSize,
                iconAnchor: [config.iconSize[0]/2, config.iconSize[1]],
                popupAnchor: [0, -config.iconSize[1]/2]
            });
            
            return L.marker(latlng, {icon: icon});
        },
        // Resto de la función permanece igual
        onEachFeature: function(feature, layer) {
            // Contenido del popup
            const popupContent = `
                <h3>${feature.properties.nombre}</h3>
                <p><strong>Tipo:</strong> ${getTipoNombre(feature.properties.tipo)}</p>
                <p><strong>Ciudad:</strong> ${feature.properties.ciudad}</p>
                ${feature.properties.imagen ? `<img src="${feature.properties.imagen}" alt="${feature.properties.nombre}" style="max-width:100%;height:auto;">` : ''}
                <p>${truncateDescription(feature.properties.descripcion, 100)}</p>
                <button class="more-info-btn" data-id="${feature.properties.id}">Ver más detalles</button>
            `;

            layer.bindPopup(popupContent);

            // Agrega este evento para manejar el clic en "Ver más detalles"
            layer.on('popupopen', function() {
                document.querySelector('.leaflet-popup-content .more-info-btn')?.addEventListener('click', function() {
                    showPlaceInfo(feature);
                    document.querySelector('.info-panel').classList.add('visible');
                    if (window.innerWidth <= 768) {
                        document.getElementById('map').style.width = '0';
                    }
                });
            });
        }
    }).addTo(map);
}

// Mostrar información detallada en el panel lateral
function showPlaceInfo(feature) {
    const infoPanel = document.getElementById('place-info');
    
    infoPanel.innerHTML = `
        <div class="place-card">
            <h2>${feature.properties.nombre}</h2>
            <p><strong>Tipo:</strong> ${getTipoNombre(feature.properties.tipo)}</p>
            <p><strong>Ciudad:</strong> ${feature.properties.ciudad}</p>
            ${feature.properties.imagen ? `<img src="${feature.properties.imagen}" alt="${feature.properties.nombre}">` : ''}
            <p>${feature.properties.descripcion}</p>
            ${feature.properties.direccion ? `<p><strong>Dirección:</strong> ${feature.properties.direccion}</p>` : ''}
            ${feature.properties.horario ? `<p><strong>Horario:</strong> ${feature.properties.horario}</p>` : ''}
            ${feature.properties.telefono ? `<p><strong>Teléfono:</strong> ${feature.properties.telefono}</p>` : ''}
            ${feature.properties.web ? `<p><strong>Sitio web:</strong> <a href="${feature.properties.web}" target="_blank">${feature.properties.web}</a></p>` : ''}
            ${feature.properties.facebook ? `<p><strong>Facebook:</strong> <a href="${feature.properties.facebook}" target="_blank">${feature.properties.facebook}</a></p>` : ''}
            <div class="action-buttons">
                <button class="action-btn" id="route-btn" data-lat="${feature.geometry.coordinates[1]}" data-lng="${feature.geometry.coordinates[0]}">
                    <i class="fas fa-route"></i> Cómo llegar
                </button>
                <button class="action-btn" id="center-btn" data-lat="${feature.geometry.coordinates[1]}" data-lng="${feature.geometry.coordinates[0]}">
                    <i class="fas fa-crosshairs"></i> Centrar
                </button>
            </div>
        </div>
    `;
    
    // Agregar eventos a los botones
    document.getElementById('route-btn')?.addEventListener('click', function() {
        startRouting(this.dataset.lat, this.dataset.lng);
    });
    
    document.getElementById('center-btn')?.addEventListener('click', function() {
        map.setView([this.dataset.lat, this.dataset.lng], 15);
    });
}

// Cerrar panel de información (en móvil)
function closeInfoPanel() {
    document.querySelector('.info-panel').classList.remove('visible');
    if (window.innerWidth <= 768) {
        document.getElementById('map').style.width = '100%';
    }
    // Cierra cualquier popup abierto
    map.closePopup();
}

// Buscar centro por nombre o ciudad
function searchCentro() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    if (!searchTerm) {
        updateCentrosLayer(allCentros);
        return;
    }
    
    const filtered = allCentros.filter(centro => {
        return centro.properties.nombre.toLowerCase().includes(searchTerm) || 
               centro.properties.ciudad.toLowerCase().includes(searchTerm);
    });
    
    updateCentrosLayer(filtered);
    
    // Si hay resultados, centrar el mapa en el primero
    if (filtered.length > 0) {
        const first = filtered[0];
        map.setView([first.geometry.coordinates[1], first.geometry.coordinates[0]], 12);
        showPlaceInfo(first);
    }
}

// Filtrar centros por tipo
function filterCentros() {
    const tipo = document.getElementById('filter-type').value;
    
    if (tipo === 'all') {
        updateCentrosLayer(allCentros);
        return;
    }
    
    const filtered = allCentros.filter(centro => centro.properties.tipo === tipo);
    updateCentrosLayer(filtered);
}

// Obtener nombre completo del tipo
function getTipoNombre(tipo) {
    const tipos = {
        'observatorio': 'Observatorio Astronómico',
        'planetario': 'Planetario',
        'museo': 'Museo Científico',
        'universidad': 'Universidad con investigación',
        'club': 'Club de Astronomía'
    };
    
    return tipos[tipo] || tipo;
}

// Acortar descripción para el popup
function truncateDescription(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Función para mostrar cómo llegar
function addRoutingControl() {
    L.Routing.control({
        waypoints: [],
        routeWhileDragging: true,
        show: false, // Ocultamos el panel de instrucciones por defecto
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
        language: 'es',
        collapsible: true
    }).addTo(map);
    
    // Necesitarás incluir la librería Leaflet Routing Machine en tu HTML
}

// Modifica showPlaceInfo para incluir el botón "Cómo llegar":
function showPlaceInfo(feature) {
    const infoPanel = document.getElementById('place-info');
    
    infoPanel.innerHTML = `
        <div class="place-card">
            <h2>${feature.properties.nombre}</h2>
            <p><strong>Tipo:</strong> ${getTipoNombre(feature.properties.tipo)}</p>
            <p><strong>Ciudad:</strong> ${feature.properties.ciudad}</p>
            ${feature.properties.imagen ? `<img src="${feature.properties.imagen}" alt="${feature.properties.nombre}">` : ''}
            <p>${feature.properties.descripcion}</p>
            ${feature.properties.direccion ? `<p><strong>Dirección:</strong> ${feature.properties.direccion}</p>` : ''}
            ${feature.properties.horario ? `<p><strong>Horario:</strong> ${feature.properties.horario}</p>` : ''}
            ${feature.properties.telefono ? `<p><strong>Teléfono:</strong> ${feature.properties.telefono}</p>` : ''}
            ${feature.properties.web ? `<p><strong>Sitio web:</strong> <a href="${feature.properties.web}" target="_blank">${feature.properties.web}</a></p>` : ''}
            ${feature.properties.facebook ? `<p><strong>Facebook:</strong> <a href="${feature.properties.facebook}" target="_blank">${feature.properties.facebook}</a></p>` : ''}
            <div class="action-buttons">
                <button class="action-btn" id="route-btn" data-lat="${feature.geometry.coordinates[1]}" data-lng="${feature.geometry.coordinates[0]}">Cómo llegar</button>
                <button class="action-btn" id="center-btn" data-lat="${feature.geometry.coordinates[1]}" data-lng="${feature.geometry.coordinates[0]}">Centrar en mapa</button>
            </div>
        </div>
    `;
    
    // Agregar eventos a los nuevos botones
    document.getElementById('route-btn').addEventListener('click', function() {
        startRouting(this.dataset.lat, this.dataset.lng);
    });
    
    document.getElementById('center-btn').addEventListener('click', function() {
        map.setView([this.dataset.lat, this.dataset.lng], 15);
    });
}

function startRouting(lat, lng) {
    // Si ya existe un control de ruta, lo eliminamos
    if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
    }
    
    // Verificar si el navegador soporta geolocalización
    if (!navigator.geolocation) {
        alert("Tu navegador no soporta geolocalización. Usa un navegador más moderno.");
        return;
    }
    
    // Mostrar mensaje de carga
    const loadingMessage = L.popup()
        .setLatLng([lat, lng])
        .setContent('<div style="padding: 10px;"><i class="fas fa-spinner fa-spin"></i> Calculando ruta...</div>')
        .openOn(map);
    
    // Obtener la ubicación actual del usuario
    navigator.geolocation.getCurrentPosition(
        function(position) {
            // Eliminar mensaje de carga
            map.closePopup();
            
            // Crear puntos de ruta
            const startPoint = L.latLng(position.coords.latitude, position.coords.longitude);
            const endPoint = L.latLng(lat, lng);
            
            // Configurar el control de ruta
            routingControl = L.Routing.control({
                waypoints: [startPoint, endPoint],
                routeWhileDragging: true,
                showAlternatives: false,
                fitSelectedRoutes: true,
                collapsible: true,
                language: 'es',
                lineOptions: {
                    styles: [{
                        color: '#4a89dc',
                        opacity: 0.8,
                        weight: 6
                    }]
                },
                createMarker: function(i, waypoint, n) {
                    if (i === 0) {
                        return L.marker(waypoint.latLng, {
                            icon: L.divIcon({
                                className: 'custom-icon',
                                html: '<i class="fas fa-user-astronaut"></i>',
                                iconSize: [30, 30]
                            })
                        }).bindPopup("Tu ubicación actual");
                    }
                    return null; // No mostrar marcador para el destino (ya existe)
                }
            }).addTo(map);
            
            // Mostrar panel de información de ruta
            routingControl.on('routesfound', function(e) {
                const routes = e.routes;
                const summary = routes[0].summary;
                
                // Mostrar información de la ruta en el panel lateral
                document.getElementById('place-info').insertAdjacentHTML('beforeend', `
                    <div class="route-info">
                        <h3><i class="fas fa-route"></i> Información de Ruta</h3>
                        <p><strong>Distancia:</strong> ${(summary.totalDistance / 1000).toFixed(1)} km</p>
                        <p><strong>Tiempo estimado:</strong> ${Math.round(summary.totalTime / 60)} minutos</p>
                        <button id="remove-route-btn" class="action-btn">
                            <i class="fas fa-times"></i> Eliminar ruta
                        </button>
                    </div>
                `);
                
                // Evento para el botón de eliminar ruta
                document.getElementById('remove-route-btn')?.addEventListener('click', function() {
                    if (routingControl) {
                        map.removeControl(routingControl);
                        routingControl = null;
                    }
                    document.querySelector('.route-info')?.remove();
                });
            });
            
            // Manejar errores de ruta
            routingControl.on('routingerror', function(e) {
                alert("No se pudo calcular la ruta: " + e.error.message);
            });
        },
        function(error) {
            map.closePopup();
            let errorMessage;
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = "Permiso de geolocalización denegado. Por favor, activa la geolocalización en tu navegador.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = "La información de ubicación no está disponible.";
                    break;
                case error.TIMEOUT:
                    errorMessage = "La solicitud de ubicación ha caducado.";
                    break;
                default:
                    errorMessage = "Error desconocido al obtener la ubicación.";
            }
            alert(errorMessage);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Manejar redimensionamiento de la ventana
function handleResize() {
    // Si estamos en móvil y el panel está visible, asegurarse de que el mapa no se vea
    if (window.innerWidth <= 768) {
        const panel = document.querySelector('.info-panel');
        if (panel.classList.contains('visible')) {
            document.getElementById('map').style.width = '0';
        } else {
            document.getElementById('map').style.width = '100%';
        }
    }
}

// Inicializar el mapa cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initMap);


