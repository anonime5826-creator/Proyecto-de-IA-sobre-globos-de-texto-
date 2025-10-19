(() => {
  const defaultEmotions = ['normal', 'feliz', 'triste', 'enojado', 'sorprendido'];
  const state = {
    chars: [],
    deleteMode: false,
    invertSide: false    // ← Flag para invertir lado de globo
  };

  // Elementos del DOM
  const charNameInput   = document.getElementById('charName');
  const charColorInput  = document.getElementById('charColor');
  const charAvatarInput = document.getElementById('charAvatar');
  const addCharBtn      = document.getElementById('addChar');
  const charsContainer  = document.getElementById('chars');
  const markCharSelect  = document.getElementById('markChar');
  const markBtn         = document.getElementById('markBtn');
  const toggleInvertBtn = document.getElementById('toggleInvert');
  const toggleDeleteBtn = document.getElementById('toggleDelete');
  const themeSelect     = document.getElementById('themeSelect');
  const editor          = document.getElementById('editor');

  // Listener para activar/desactivar inversión de lado
  toggleInvertBtn.addEventListener('click', () => {
    state.invertSide = !state.invertSide;
    toggleInvertBtn.textContent = state.invertSide ? '✓' : '⇄';
  });

  // Generador de IDs únicas
  function uid(prefix = 'id') {
    return prefix + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Convierte File a dataURL
  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result);
      reader.onerror = () => reject('Error leyendo archivo');
      reader.readAsDataURL(file);
    });
  }

  // Renderiza personajes en el panel y en el <select>
  function renderChars() {
    charsContainer.innerHTML = '';
    markCharSelect.innerHTML = '';

    if (!state.chars.length) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '(Sin personajes)';
      markCharSelect.appendChild(opt);
      return;
    }

    state.chars.forEach(c => {
      // Tarjeta
      const card = document.createElement('div');
      card.className = 'char-card';

      const header = document.createElement('div');
      header.className = 'char-header';

      const avatar = document.createElement('img');
      avatar.className = 'char-avatar';
      avatar.src = c.emotions[c.currentEmotion];
      avatar.alt = c.name;

      const nameDiv = document.createElement('div');
      nameDiv.className = 'char-name';
      nameDiv.textContent = c.name;

      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'add-emotion';
      toggleBtn.textContent = '+';
      toggleBtn.onclick = () => card.classList.toggle('open');

      header.append(avatar, nameDiv, toggleBtn);
      card.append(header);

      // Panel de emociones
      const emotionsPanel = document.createElement('div');
      emotionsPanel.className = 'emotions-panel';
      defaultEmotions.forEach(em => {
        const wrap = document.createElement('div');
        wrap.className = 'emotion-wrap';

        const img = document.createElement('img');
        img.className = 'emotion-avatar';
        img.src = c.emotions[em];
        img.title = em;
        if (c.currentEmotion === em) img.classList.add('selected');
        img.onclick = () => {
          c.currentEmotion = em;
          renderChars();
        };

        const changeBtn = document.createElement('button');
        changeBtn.className = 'change-emotion';
        changeBtn.textContent = '✎';
        changeBtn.onclick = async () => {
          const inp = document.createElement('input');
          inp.type     = 'file';
          inp.accept   = 'image/*';
          inp.onchange = async ev => {
            const file = ev.target.files[0];
            if (!file) return;
            c.emotions[em] = await fileToDataURL(file);
            renderChars();
          };
          inp.click();
        };

        wrap.append(img, changeBtn);
        emotionsPanel.append(wrap);
      });

      card.append(emotionsPanel);
      charsContainer.append(card);

      // Opción en <select>
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      markCharSelect.appendChild(opt);
    });
  }

  // Inserta el globo alrededor del texto seleccionado
  function wrapSelectionWithBalloon() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return alert('Selecciona texto en el editor');

    const range = sel.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) {
      return alert('Solo puedes añadir globos dentro del área de historia');
    }

    const fragment = range.extractContents();
    const charId = markCharSelect.value;
    if (!charId) return alert('Selecciona un personaje');

    const charData = state.chars.find(c => c.id === charId);

    // Crear globo
    const wrap = document.createElement('div');
    wrap.className = 'balloon';
    // ← Solo al crearlo: añade 'right' si invertSide = true
    if (state.invertSide) wrap.classList.add('right');
    wrap.style.background = charData.color;

    // Nombre arriba
    const nameEl = document.createElement('div');
    nameEl.className = 'name';
    nameEl.textContent = charData.name;

    // Avatar flotante
    const avatarWrap = document.createElement('div');
    avatarWrap.className = 'avatar-wrap';
    const avatarEl = document.createElement('img');
    avatarEl.className = 'avatar';
    avatarEl.src = charData.emotions[charData.currentEmotion];
    avatarEl.alt = charData.name;
    avatarWrap.appendChild(avatarEl);

    // Texto
    const dialogueEl = document.createElement('div');
    dialogueEl.className = 'dialogue';
    dialogueEl.appendChild(fragment);

    wrap.append(nameEl, avatarWrap, dialogueEl);

    // Insertar en el editor
    range.insertNode(wrap);
    sel.removeAllRanges();
    wrap.scrollIntoView({ block: 'nearest' });
  }

  // Mostrar/ocultar manejadores de borrado
  function renderDeleteHandles() {
    editor.querySelectorAll('.balloon').forEach(b => {
      if (state.deleteMode) {
        if (!b.querySelector('.del-handle')) {
          const btn = document.createElement('button');
          btn.className   = 'del-handle';
          btn.textContent = '🗑️';
          btn.onclick     = () => b.remove();
          b.append(btn);
        }
      } else {
        const ex = b.querySelector('.del-handle');
        if (ex) ex.remove();
      }
    });
  }

  // Eventos

  addCharBtn.addEventListener('click', async () => {
    const name  = charNameInput.value.trim();
    const color = charColorInput.value.trim() || '#f3c26b';
    const file  = charAvatarInput.files[0];
    if (!name) return alert('Ponle un nombre al personaje');

    let dataUrl;
    if (file) {
      dataUrl = await fileToDataURL(file);
    } else {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
        <rect width="100%" height="100%" fill="${color}"/>
        <text x="50%" y="55%" dominant-baseline="middle"
              text-anchor="middle" font-size="50" fill="#fff">
          ${name[0]}
        </text>
      </svg>`;
      dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }

    state.chars.push({
      id: uid('char'),
      name,
      color,
      emotions: Object.fromEntries(defaultEmotions.map(em => [em, dataUrl])),
      currentEmotion: 'normal'
    });

    charNameInput.value   = '';
    charAvatarInput.value = '';
    renderChars();
  });

  markBtn.addEventListener('click', wrapSelectionWithBalloon);

  toggleDeleteBtn.addEventListener('click', () => {
    state.deleteMode = !state.deleteMode;
    document.querySelector('.story-area')
      .classList.toggle('delete-mode', state.deleteMode);
    renderDeleteHandles();
  });

  themeSelect.addEventListener('change', () => {
    const sa = document.querySelector('.story-area');
    sa.classList.remove('theme-white', 'theme-dark', 'theme-blue');
    sa.classList.add('theme-' + themeSelect.value);
  });

  editor.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const sel = window.getSelection();
      if (!sel.rangeCount) return;
      const anchor = sel.anchorNode;
      const balloon = anchor.nodeType === 1
        ? anchor.closest('.balloon')
        : anchor.parentElement.closest('.balloon');
      if (balloon && editor.contains(balloon)) {
        e.preventDefault();
        const br = document.createElement('br');
        balloon.after(br);
        const range = document.createRange();
        range.setStartAfter(br);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        br.scrollIntoView({ block: 'nearest' });
      }
    }
  });

  // Inicialización
  renderChars();
})();
