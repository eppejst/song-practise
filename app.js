(function () {
  'use strict';

  const SECTION_COLORS = [
    '#4a6cf7', '#16a34a', '#ea580c', '#e11d48', '#7c3aed',
    '#0284c7', '#dc2626', '#ca8a04', '#059669', '#ea580c'
  ];

  // ---- State ----
  let songs = [];
  let currentSong = null;
  let currentParts = [];
  let currentVoicePart = null;
  let sections = [];
  let activeLoop = null;
  let markStart = null;
  let playbackSpeed = 1;
  let pendingAddAfterIndex = null;

  // Handle drag state for section edges on the timeline
  let dragState = null; // { sectionIndex, edge: 'start'|'end' }

  // ---- DOM refs ----
  const $ = (s) => document.querySelector(s);
  const audio = $('#audio-el');
  const songListScreen = $('#song-list-screen');
  const playerScreen = $('#player-screen');
  const songListEl = $('#song-list');
  const noSongsEl = $('#no-songs');
  const introBanner = $('#intro-banner');
  const dismissIntro = $('#dismiss-intro');
  const songTitle = $('#song-title');
  const backBtn = $('#back-btn');
  const voiceSelect = $('#voice-select');
  const playBtn = $('#play-btn');
  const playIcon = $('#play-icon');
  const pauseIcon = $('#pause-icon');
  const currentTimeEl = $('#current-time');
  const totalTimeEl = $('#total-time');
  const timelineContainer = $('#timeline-container');
  const timelineCanvas = $('#timeline-canvas');
  const timelineCursor = $('#timeline-cursor');
  const markStartBtn = $('#mark-start-btn');
  const markEndBtn = $('#mark-end-btn');
  const markStatus = $('#mark-status');
  const loopIndicator = $('#loop-indicator');
  const loopInfo = $('#loop-info');
  const stopLoopBtn = $('#stop-loop-btn');
  const sectionListEl = $('#section-list');
  const noSectionsEl = $('#no-sections');
  const showPdfBtn = $('#show-pdf-btn');
  const pdfPanel = $('#pdf-panel');
  const pdfViewer = $('#pdf-viewer');
  const divider = $('#divider');
  const sectionModal = $('#section-modal');
  const modalTitle = $('#modal-title');
  const sectionNameInput = $('#section-name-input');
  const repeatModeSelect = $('#repeat-mode-select');
  const repeatCountLabel = $('#repeat-count-label');
  const repeatCountInput = $('#repeat-count-input');
  const modalCancel = $('#modal-cancel');
  const modalSave = $('#modal-save');

  let editingSectionIndex = null;

  // ---- Helpers ----
  function formatTime(sec) {
    if (!isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function storageKey(song, part, suffix) {
    const s = (song || '').replace(/\s+/g, '_');
    const p = (part || '').replace(/\s+/g, '_');
    return 'choir_app_' + s + '_' + p + '_' + suffix;
  }

  function saveSections() {
    if (!currentSong || !currentVoicePart) return;
    const key = storageKey(currentSong.name, currentVoicePart.label, 'sections');
    localStorage.setItem(key, JSON.stringify(sections));
  }

  function loadSections() {
    if (!currentSong || !currentVoicePart) return;
    const key = storageKey(currentSong.name, currentVoicePart.label, 'sections');
    try {
      sections = JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      sections = [];
    }
  }

  function savePrefs() {
    if (!currentSong) return;
    const prefs = { voicePart: currentVoicePart?.label, speed: playbackSpeed };
    localStorage.setItem('choir_app_' + currentSong.name.replace(/\s+/g, '_') + '_prefs', JSON.stringify(prefs));
  }

  function loadPrefs() {
    if (!currentSong) return null;
    try {
      return JSON.parse(localStorage.getItem('choir_app_' + currentSong.name.replace(/\s+/g, '_') + '_prefs'));
    } catch {
      return null;
    }
  }

  // ---- Voice Part Parsing ----
  function parseVoiceParts(files) {
    const partMap = new Map();
    const pattern = /[_\-\s.](B1|B2|T1|T2)(?:[_\-](\d+))?/i;
    for (const file of files) {
      const match = file.match(pattern);
      if (!match) continue;
      const base = match[1].toUpperCase();
      const sub = match[2] || null;
      const label = sub ? base + '_' + sub : base;
      const names = { B1: 'Bass 1', B2: 'Bass 2', T1: 'Tenor 1', T2: 'Tenor 2' };
      const displayName = sub ? names[base] + ' (' + sub + ')' : names[base];
      partMap.set(label, { label, displayName, file });
    }
    const order = ['T1', 'T2', 'B1', 'B2'];
    return [...partMap.values()].sort((a, b) => {
      const ai = order.indexOf(a.label.split('_')[0]);
      const bi = order.indexOf(b.label.split('_')[0]);
      if (ai !== bi) return ai - bi;
      return a.label.localeCompare(b.label);
    });
  }

  // ---- Init ----
  async function init() {
    if (localStorage.getItem('choir_app_intro_dismissed')) {
      introBanner.style.display = 'none';
    }
    dismissIntro.addEventListener('click', () => {
      introBanner.style.display = 'none';
      localStorage.setItem('choir_app_intro_dismissed', '1');
    });

    try {
      const resp = await fetch('songs.json');
      const data = await resp.json();
      songs = data.songs || [];
    } catch {
      songs = [];
    }

    if (songs.length === 0) {
      noSongsEl.style.display = 'block';
    } else {
      renderSongList();
    }

    setupEventListeners();
  }

  function renderSongList() {
    songListEl.innerHTML = '';
    for (const song of songs) {
      const li = document.createElement('li');
      li.textContent = song.name;
      const arrow = document.createElement('span');
      arrow.className = 'arrow';
      arrow.textContent = '›';
      li.appendChild(arrow);
      li.addEventListener('click', () => openSong(song));
      songListEl.appendChild(li);
    }
  }

  // ---- Open Song ----
  function openSong(song) {
    currentSong = song;
    songTitle.textContent = song.name;

    currentParts = parseVoiceParts(song.files);
    if (currentParts.length === 0) return;

    // Populate voice dropdown
    voiceSelect.innerHTML = '';
    for (const part of currentParts) {
      const opt = document.createElement('option');
      opt.value = part.label;
      opt.textContent = part.displayName;
      voiceSelect.appendChild(opt);
    }

    const prefs = loadPrefs();
    const prefPart = prefs && currentParts.find(p => p.label === prefs.voicePart);
    if (prefs?.speed) {
      setSpeed(prefs.speed);
    }

    const initialPart = prefPart || currentParts[0];
    voiceSelect.value = initialPart.label;
    selectVoicePart(initialPart);

    // PDF
    if (song.pdf) {
      const pdfUrl = song.folder + '/' + song.pdf;
      pdfViewer.src = pdfUrl;
      showPdfBtn.style.display = '';
      if (window.innerWidth >= 768) {
        pdfPanel.style.display = '';
      }
    } else {
      pdfViewer.src = '';
      showPdfBtn.style.display = 'none';
      pdfPanel.style.display = 'none';
      pdfPanel.classList.remove('mobile-show');
    }

    songListScreen.classList.remove('active');
    playerScreen.classList.add('active');
  }

  function selectVoicePart(part) {
    currentVoicePart = part;
    stopLoop();
    markStart = null;
    pendingAddAfterIndex = null;
    markStatus.textContent = '';
    markStartBtn.classList.remove('marking');
    markEndBtn.disabled = true;

    const url = currentSong.folder + '/' + part.file;
    audio.src = url;
    audio.load();
    audio.playbackRate = playbackSpeed;
    updatePlayButton();

    loadSections();
    renderSections();
    drawTimeline();
    renderHandles();
    savePrefs();
    setupMediaSession();
  }

  // ---- Audio Controls ----
  function togglePlay() {
    if (!audio.src) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }

  function updatePlayButton() {
    if (audio.paused) {
      playIcon.style.display = '';
      pauseIcon.style.display = 'none';
    } else {
      playIcon.style.display = 'none';
      pauseIcon.style.display = '';
    }
  }

  function setSpeed(speed) {
    playbackSpeed = speed;
    audio.playbackRate = speed;
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.classList.toggle('active', parseFloat(btn.dataset.speed) === speed);
    });
    savePrefs();
  }

  function seekTo(fraction) {
    if (!isFinite(audio.duration)) return;
    audio.currentTime = fraction * audio.duration;
  }

  // ---- Timeline Drawing ----
  function drawTimeline() {
    const canvas = timelineCanvas;
    const rect = timelineContainer.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;
    const dur = audio.duration || 1;

    ctx.clearRect(0, 0, w, h);

    // Draw section regions
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      const x1 = (sec.start / dur) * w;
      const x2 = (sec.end / dur) * w;
      ctx.fillStyle = SECTION_COLORS[i % SECTION_COLORS.length] + '28';
      ctx.fillRect(x1, 0, x2 - x1, h);
      // Edge lines
      ctx.fillStyle = SECTION_COLORS[i % SECTION_COLORS.length] + '88';
      ctx.fillRect(x1, 0, 2, h);
      ctx.fillRect(x2 - 2, 0, 2, h);
    }

    // Draw waveform-like bars
    ctx.fillStyle = '#00000010';
    const bars = 100;
    const barW = w / bars;
    for (let i = 0; i < bars; i++) {
      const barH = 10 + Math.sin(i * 0.4) * 8 + Math.sin(i * 1.3) * 10 + Math.cos(i * 0.7) * 6;
      const y = (h - barH) / 2;
      ctx.fillRect(i * barW + 1, y, barW - 2, barH);
    }

    // Progress fill
    if (audio.duration) {
      const progress = audio.currentTime / audio.duration;
      ctx.fillStyle = '#4a6cf718';
      ctx.fillRect(0, 0, progress * w, h);
    }
  }

  // ---- Section Drag Handles on Timeline ----
  function renderHandles() {
    timelineContainer.querySelectorAll('.section-handle').forEach(el => el.remove());
    const dur = audio.duration || 1;
    const w = timelineContainer.getBoundingClientRect().width;
    if (!w) return;

    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      for (const edge of ['start', 'end']) {
        const handle = document.createElement('div');
        handle.className = 'section-handle';
        handle.dataset.section = i;
        handle.dataset.edge = edge;
        const timeFrac = sec[edge] / dur;
        handle.style.left = (timeFrac * w - 6) + 'px';

        handle.addEventListener('mousedown', (e) => startHandleDrag(e, i, edge));
        handle.addEventListener('touchstart', (e) => startHandleDrag(e, i, edge), { passive: false });

        timelineContainer.appendChild(handle);
      }
    }
  }

  function startHandleDrag(e, sectionIndex, edge) {
    e.preventDefault();
    e.stopPropagation();
    dragState = { sectionIndex, edge };
    const handle = e.target.closest('.section-handle');
    if (handle) handle.classList.add('dragging');

    function onMove(ev) {
      if (!dragState) return;
      const rect = timelineContainer.getBoundingClientRect();
      const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const time = frac * (audio.duration || 1);
      const sec = sections[dragState.sectionIndex];

      if (dragState.edge === 'start') {
        sec.start = Math.round(Math.min(time, sec.end - 0.5) * 100) / 100;
      } else {
        sec.end = Math.round(Math.max(time, sec.start + 0.5) * 100) / 100;
      }
      saveSections();
      drawTimeline();
      renderHandles();
      renderSections();
    }

    function onUp() {
      dragState = null;
      document.querySelectorAll('.section-handle.dragging').forEach(h => h.classList.remove('dragging'));
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
  }

  function updateCursor() {
    if (!audio.duration) return;
    const frac = audio.currentTime / audio.duration;
    timelineCursor.style.left = (frac * 100) + '%';
    currentTimeEl.textContent = formatTime(audio.currentTime);
  }

  // ---- Section Marking ----
  function onMarkStart() {
    if (markStart !== null) {
      markStart = null;
      pendingAddAfterIndex = null;
      markStartBtn.classList.remove('marking');
      markEndBtn.disabled = true;
      markStatus.textContent = '';
      return;
    }
    markStart = audio.currentTime;
    markStartBtn.classList.add('marking');
    markEndBtn.disabled = false;
    markStatus.textContent = 'Start: ' + formatTime(markStart);
  }

  function onMarkEnd() {
    if (markStart === null) return;
    let end = audio.currentTime;
    let start = markStart;
    if (end < start) [start, end] = [end, start];
    if (end - start < 0.5) return;

    const insertIndex = pendingAddAfterIndex !== null ? pendingAddAfterIndex + 1 : sections.length;

    markStart = null;
    pendingAddAfterIndex = null;
    markStartBtn.classList.remove('marking');
    markEndBtn.disabled = true;
    markStatus.textContent = '';

    const newSection = {
      name: 'Section ' + (sections.length + 1),
      start: Math.round(start * 100) / 100,
      end: Math.round(end * 100) / 100,
      repeatMode: 'none',
      repeatCount: 3
    };
    sections.splice(insertIndex, 0, newSection);
    saveSections();
    renderSections();
    drawTimeline();
    renderHandles();

    openSectionModal(insertIndex);
  }

  // "Add next section" - starts a new section right where the previous one ended
  function addSectionAfter(index) {
    const prevSection = sections[index];
    pendingAddAfterIndex = index;
    markStart = prevSection.end;
    markStartBtn.classList.add('marking');
    markEndBtn.disabled = false;
    markStatus.textContent = 'Start: ' + formatTime(markStart) + ' (after "' + prevSection.name + '")';
    audio.currentTime = prevSection.end;
    audio.play().catch(() => {});
  }

  // ---- Section Rendering ----
  function renderSections() {
    sectionListEl.innerHTML = '';
    noSectionsEl.style.display = sections.length === 0 ? '' : 'none';

    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      const li = document.createElement('li');
      li.className = 'section-item';
      if (activeLoop && activeLoop.sectionIndex === i) {
        li.classList.add('active-loop');
      }

      const color = document.createElement('div');
      color.className = 'section-color';
      color.style.background = SECTION_COLORS[i % SECTION_COLORS.length];

      const info = document.createElement('div');
      info.className = 'section-info';
      const name = document.createElement('div');
      name.className = 'section-name';
      name.textContent = sec.name;
      const times = document.createElement('div');
      times.className = 'section-times';
      times.textContent = formatTime(sec.start) + ' – ' + formatTime(sec.end);
      info.appendChild(name);
      info.appendChild(times);

      const badge = document.createElement('span');
      badge.className = 'section-repeat-badge';
      if (sec.repeatMode === 'none') {
        badge.textContent = '1x';
      } else if (sec.repeatMode === 'infinite') {
        badge.textContent = '∞';
      } else {
        badge.textContent = sec.repeatCount + 'x';
      }

      const actions = document.createElement('div');
      actions.className = 'section-actions';

      const editBtn = document.createElement('button');
      editBtn.innerHTML = '&#9998;';
      editBtn.setAttribute('aria-label', 'Edit');
      editBtn.addEventListener('click', (e) => { e.stopPropagation(); openSectionModal(i); });

      const delBtn = document.createElement('button');
      delBtn.innerHTML = '&#10005;';
      delBtn.setAttribute('aria-label', 'Delete');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activeLoop && activeLoop.sectionIndex === i) stopLoop();
        sections.splice(i, 1);
        saveSections();
        renderSections();
        drawTimeline();
        renderHandles();
      });

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      li.appendChild(color);
      li.appendChild(info);
      li.appendChild(badge);
      li.appendChild(actions);

      li.addEventListener('click', () => playSectionOrLoop(i));
      sectionListEl.appendChild(li);

      // "Add next" button after each section
      const addBtn = document.createElement('div');
      addBtn.className = 'section-add-next';
      addBtn.innerHTML = '<span class="plus-icon">+</span> Add next section';
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addSectionAfter(i);
      });
      sectionListEl.appendChild(addBtn);
    }
  }

  // ---- Section Modal ----
  function openSectionModal(index) {
    editingSectionIndex = index;
    const sec = sections[index];
    modalTitle.textContent = 'Edit Section';
    sectionNameInput.value = sec.name;
    repeatModeSelect.value = sec.repeatMode || 'none';
    repeatCountInput.value = sec.repeatCount;
    repeatCountLabel.style.display = repeatModeSelect.value === 'count' ? '' : 'none';
    sectionModal.style.display = '';
    sectionNameInput.focus();
    sectionNameInput.select();
  }

  function closeSectionModal() {
    sectionModal.style.display = 'none';
    editingSectionIndex = null;
  }

  function saveSectionModal() {
    if (editingSectionIndex === null) return;
    const sec = sections[editingSectionIndex];
    sec.name = sectionNameInput.value.trim() || sec.name;
    sec.repeatMode = repeatModeSelect.value;
    sec.repeatCount = Math.max(1, parseInt(repeatCountInput.value) || 3);
    saveSections();
    renderSections();
    closeSectionModal();
  }

  // ---- Play Section / Looping ----
  function playSectionOrLoop(index) {
    const sec = sections[index];
    if (sec.repeatMode === 'none') {
      // Play once: just seek to start and play, set a one-shot "loop"
      activeLoop = { sectionIndex: index, remaining: 1, total: 1 };
    } else if (sec.repeatMode === 'infinite') {
      activeLoop = { sectionIndex: index, remaining: Infinity, total: Infinity };
    } else {
      activeLoop = { sectionIndex: index, remaining: sec.repeatCount, total: sec.repeatCount };
    }
    audio.currentTime = sec.start;
    audio.play().catch(() => {});
    updateLoopIndicator();
    renderSections();
  }

  function stopLoop() {
    activeLoop = null;
    loopIndicator.style.display = 'none';
    renderSections();
  }

  function updateLoopIndicator() {
    if (!activeLoop) {
      loopIndicator.style.display = 'none';
      return;
    }
    loopIndicator.style.display = '';
    const sec = sections[activeLoop.sectionIndex];
    if (!sec) { stopLoop(); return; }
    if (sec.repeatMode === 'none') {
      loopInfo.textContent = 'Playing "' + sec.name + '"';
    } else if (activeLoop.total === Infinity) {
      loopInfo.textContent = 'Looping "' + sec.name + '"';
    } else {
      const current = activeLoop.total - activeLoop.remaining + 1;
      loopInfo.textContent = '"' + sec.name + '" — ' + current + ' of ' + activeLoop.total;
    }
  }

  function checkLoop() {
    if (!activeLoop) return;
    const sec = sections[activeLoop.sectionIndex];
    if (!sec) { stopLoop(); return; }
    if (audio.currentTime >= sec.end) {
      activeLoop.remaining--;
      if (activeLoop.remaining <= 0) {
        audio.pause();
        stopLoop();
        updatePlayButton();
        return;
      }
      audio.currentTime = sec.start;
      updateLoopIndicator();
    }
  }

  // ---- Media Session (lock screen controls) ----
  function setupMediaSession() {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentVoicePart ? currentVoicePart.displayName : '',
      artist: currentSong ? currentSong.name : 'DnS øveapp',
      album: 'DnS øveapp'
    });
    navigator.mediaSession.setActionHandler('play', () => { audio.play(); });
    navigator.mediaSession.setActionHandler('pause', () => { audio.pause(); });
    navigator.mediaSession.setActionHandler('seekbackward', () => {
      audio.currentTime = Math.max(0, audio.currentTime - 10);
    });
    navigator.mediaSession.setActionHandler('seekforward', () => {
      audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime != null) audio.currentTime = details.seekTime;
    });
  }

  // ---- Divider Drag (Desktop) ----
  function setupDivider() {
    let dragging = false;
    let startX = 0;
    let startWidth = 0;

    divider.addEventListener('mousedown', (e) => {
      dragging = true;
      startX = e.clientX;
      startWidth = pdfPanel.offsetWidth;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const newW = Math.max(200, Math.min(window.innerWidth * 0.7, startWidth + dx));
      pdfPanel.style.width = newW + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    });
  }

  // ---- Timeline Interaction ----
  function setupTimeline() {
    let scrubbing = false;

    function scrub(e) {
      const rect = timelineContainer.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      seekTo(frac);
      updateCursor();
      drawTimeline();
    }

    timelineContainer.addEventListener('mousedown', (e) => {
      if (e.target.closest('.section-handle')) return;
      scrubbing = true;
      scrub(e);
    });
    timelineContainer.addEventListener('touchstart', (e) => {
      if (e.target.closest('.section-handle')) return;
      scrubbing = true;
      scrub(e);
    }, { passive: true });

    document.addEventListener('mousemove', (e) => { if (scrubbing) scrub(e); });
    document.addEventListener('touchmove', (e) => { if (scrubbing) scrub(e); }, { passive: true });
    document.addEventListener('mouseup', () => { scrubbing = false; });
    document.addEventListener('touchend', () => { scrubbing = false; });
  }

  // ---- Keyboard Shortcuts ----
  function setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      // Don't handle keys when modal is open or typing in an input
      if (sectionModal.style.display !== 'none') return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
      if (!playerScreen.classList.contains('active')) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          audio.currentTime = Math.max(0, audio.currentTime - 5);
          updateCursor();
          drawTimeline();
          break;
        case 'ArrowRight':
          e.preventDefault();
          audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
          updateCursor();
          drawTimeline();
          break;
      }
    });
  }

  // ---- Events ----
  function setupEventListeners() {
    backBtn.addEventListener('click', () => {
      audio.pause();
      audio.src = '';
      stopLoop();
      playerScreen.classList.remove('active');
      songListScreen.classList.add('active');
    });

    voiceSelect.addEventListener('change', () => {
      const part = currentParts.find(p => p.label === voiceSelect.value);
      if (part) selectVoicePart(part);
    });

    playBtn.addEventListener('click', togglePlay);

    audio.addEventListener('play', updatePlayButton);
    audio.addEventListener('pause', updatePlayButton);
    audio.addEventListener('loadedmetadata', () => {
      totalTimeEl.textContent = formatTime(audio.duration);
      drawTimeline();
      renderHandles();
    });
    audio.addEventListener('timeupdate', () => {
      updateCursor();
      drawTimeline();
      checkLoop();
    });
    audio.addEventListener('ended', () => {
      updatePlayButton();
    });

    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setSpeed(parseFloat(btn.dataset.speed));
      });
    });

    markStartBtn.addEventListener('click', onMarkStart);
    markEndBtn.addEventListener('click', onMarkEnd);
    stopLoopBtn.addEventListener('click', stopLoop);

    // Modal
    repeatModeSelect.addEventListener('change', () => {
      repeatCountLabel.style.display = repeatModeSelect.value === 'count' ? '' : 'none';
    });
    modalCancel.addEventListener('click', closeSectionModal);
    modalSave.addEventListener('click', saveSectionModal);
    sectionModal.addEventListener('click', (e) => {
      if (e.target === sectionModal) closeSectionModal();
    });
    sectionModal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); saveSectionModal(); }
    });

    // Mobile PDF toggle
    showPdfBtn.addEventListener('click', () => {
      pdfPanel.classList.toggle('mobile-show');
      showPdfBtn.textContent = pdfPanel.classList.contains('mobile-show')
        ? 'Hide Sheet Music'
        : 'Show Sheet Music (PDF)';
    });

    window.addEventListener('resize', () => {
      drawTimeline();
      renderHandles();
    });

    setupTimeline();
    setupDivider();
    setupKeyboard();
  }

  // ---- Boot ----
  document.addEventListener('DOMContentLoaded', init);
})();
