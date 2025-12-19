// SAFE PORTAL IN — MAIN SCRIPT
document.addEventListener("DOMContentLoaded", function () {

  const sosBtn = document.getElementById("activateSosBtn");
  const sosCenterBtn = document.getElementById("sosCenterBtn");
  const sosModal = document.getElementById("sosModal");
  const cancelSos = document.getElementById("cancelSos");
  const confirmSos = document.getElementById("confirmSos");
  const searchInput = document.getElementById("searchInput");

  function openModal() {
    sosModal.style.display = "flex";
  }

  function closeModal() {
    sosModal.style.display = "none";
  }

  if (sosBtn) sosBtn.addEventListener("click", openModal);
  if (sosCenterBtn) sosCenterBtn.addEventListener("click", openModal);
  if (cancelSos) cancelSos.addEventListener("click", closeModal);

  if (confirmSos) {
    confirmSos.addEventListener("click", function () {
      closeModal();
      alert("SOS sent to emergency authorities!");
    });
  }

  // Close modal on background click
  if (sosModal) {
    sosModal.addEventListener("click", function (e) {
      if (e.target === sosModal) closeModal();
    });
  }

  // Search functionality (demo)
  if (searchInput) {
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        const q = searchInput.value.trim();
        if (!q) return;
        alert("Searching destination: " + q);
      }
    });
  }
  // -------------------- NEARBY LOCATIONS FEATURE --------------------

  const DESTINATIONS = [
    {
      name: "Shimla, Himachal Pradesh",
      lat: 31.1048, lon: 77.1734,
      rating: 4.5,
      status: "Very Safe",
      img: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=60"
    },
    {
      name: "Leh-Ladakh, Jammu & Kashmir",
      lat: 34.1526, lon: 77.5770,
      rating: 3.0,
      status: "Moderate",
      img: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c0?auto=format&fit=crop&w=800&q=60"
    },
    {
      name: "Manali, Himachal Pradesh",
      lat: 32.2432, lon: 77.1892,
      rating: 4.2,
      status: "Safe",
      img: "https://images.unsplash.com/photo-1516542076529-1ea3854896f2?auto=format&fit=crop&w=800&q=60"
    }
  ];

  // Haversine formula (distance calculation)
  function km(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  document.getElementById("findNearbyBtn").onclick = () => {
    if (!navigator.geolocation) {
      nearbyMessage.textContent = "Geolocation not supported.";
      return;
    }

    nearbyMessage.textContent = "Detecting your location…";

    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;

      const results = DESTINATIONS.map(d => {
        d.distance = km(latitude, longitude, d.lat, d.lon);
        return d;
      }).sort((a, b) => a.distance - b.distance);

      displayNearby(results);
    }, () => {
      nearbyMessage.textContent = "Location permission denied.";
    });
  };

  function displayNearby(list) {
    const g = document.getElementById("nearbyGrid");
    g.innerHTML = "";
    nearbyMessage.textContent = "Closest monitored locations:";

    list.forEach(d => {
      g.innerHTML += `
            <article class="card">
                <div class="card-media" style="background-image:url('${d.img}')"></div>
                <div class="card-body">
                    <h3>${d.name}</h3>
                    <div class="rating">★★★★☆ <span class="rating-number">${d.rating}</span></div>
                    <div class="nearby-distance">${d.distance.toFixed(1)} km away</div>
                    <div class="status ${d.status.toLowerCase().includes('safe') ? 'safe' : 'moderate'}">${d.status}</div>
                </div>
            </article>`;
    });
  }

  /* ------------------- CLICKABLE MAP VIEW (Leaflet) ------------------- */

  // Load Leaflet JS dynamically (so we don't break pages without internet)
  (function () {
    const leafletUrl = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    let leafletLoaded = false;
    let mapInstance = null;
    let markersLayer = null;

    function loadLeaflet(callback) {
      if (leafletLoaded) return callback();
      const s = document.createElement('script');
      s.src = leafletUrl;
      s.async = true;
      s.onload = function () {
        leafletLoaded = true;
        callback();
      };
      s.onerror = function () {
        alert('Unable to load map library. Check your internet connection.');
      };
      document.head.appendChild(s);
    }

    // initialize map inside modal
    function initMap() {
      if (!leafletLoaded) {
        console.warn('Leaflet not loaded yet');
        return;
      }
      if (mapInstance) return mapInstance;

      // create map
      mapInstance = L.map('mapContainer', {
        center: [20.5937, 78.9629], // centre of India
        zoom: 5,
        zoomControl: true
      });

      // add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstance);

      // create markers layer group
      markersLayer = L.layerGroup().addTo(mapInstance);

      return mapInstance;
    }

    // Add markers for a list of places and open popup on the clicked marker
    function setMarkersAndFit(list, openPopupForIndex = 0) {
      if (!mapInstance) return;
      markersLayer.clearLayers();
      const latlngs = [];

      list.forEach((d, idx) => {
        if (!d.lat || !d.lon) return;
        const m = L.marker([d.lat, d.lon]).addTo(markersLayer);
        const popupHtml = `<strong>${escapeHtml(d.name)}</strong><div style="margin-top:6px;">Rating: ${d.rating.toFixed(1)} / 5</div><div style="margin-top:6px;color:${d.status.toLowerCase().includes('safe') ? '#2a9d6f' : '#ff8c00'}">${d.status}</div>`;
        m.bindPopup(popupHtml, { maxWidth: 260 });
        latlngs.push([d.lat, d.lon]);
        // if this marker should be opened immediately
        if (idx === openPopupForIndex) {
          m.on('popupopen', () => { });
        }
      });

      if (latlngs.length === 0) return;
      const bounds = L.latLngBounds(latlngs);
      mapInstance.fitBounds(bounds.pad(0.25));
      // open first popup (optional)
      const first = markersLayer.getLayers()[openPopupForIndex] || markersLayer.getLayers()[0];
      if (first) first.openPopup();
    }

    // Helper: escape HTML for popup content
    function escapeHtml(str) {
      return (str + '').replace(/[&<>"'`=\/]/g, function (s) {
        return ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;'
        })[s];
      });
    }

    // open map modal and show markers (optionally centered on a single place)
    function openMapModal(list, focusIndex = 0) {
      const mapModal = document.getElementById('mapModal');
      if (!mapModal) return;
      mapModal.style.display = 'flex';
      mapModal.setAttribute('aria-hidden', 'false');

      loadLeaflet(function () {
        // wait a tick so the modal layout is applied
        setTimeout(function () {
          initMap();
          setMarkersAndFit(list, focusIndex);
          // invalidate size in case container was hidden
          setTimeout(() => { mapInstance.invalidateSize(); }, 200);
        }, 100);
      });
    }

    function closeMapModal() {
      const mapModal = document.getElementById('mapModal');
      if (!mapModal) return;
      mapModal.style.display = 'none';
      mapModal.setAttribute('aria-hidden', 'true');
    }

    // Wire UI: close button and zoom all
    document.addEventListener('click', function (e) {
      const t = e.target;

      // view on map button (delegated)
      if (t.matches && (t.matches('.view-map') || t.classList.contains('view-map'))) {
        e.preventDefault();
        // find place data attributes
        const lat = parseFloat(t.getAttribute('data-lat'));
        const lon = parseFloat(t.getAttribute('data-lon'));
        const name = t.getAttribute('data-name') || '';
        const place = { name: name, lat: lat, lon: lon, rating: parseFloat(t.getAttribute('data-rating') || '0'), status: t.getAttribute('data-status') || '' };
        openMapModal([place], 0);
        return;
      }

      // zoom all button
      if (t.id === 'zoomAllBtn') {
        // use current DESTINATIONS list (if available) or find list on page
        if (typeof DESTINATIONS !== 'undefined' && DESTINATIONS && DESTINATIONS.length) {
          openMapModal(DESTINATIONS, 0);
        }
        return;
      }

      // close map button or click on close
      if (t.id === 'closeMapBtn') {
        closeMapModal();
        return;
      }

      // click outside modal-inner to close
      if (t.id === 'mapModal') {
        // clicking backdrop
        closeMapModal();
        return;
      }
    }, false);

    // make sure Escape closes map
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        const mapModal = document.getElementById('mapModal');
        if (mapModal && mapModal.style.display === 'flex') closeMapModal();
      }
    });

    // Expose openMapModal to other script code (so displayNearby can call it)
    window.safePortalMap = {
      openMapModal: openMapModal,
      closeMapModal: closeMapModal
    };
  })();



});
