// SHRINK — Client-side PDF Compressor
// Tool #17 in the 30-Day Utility Challenge

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const queueSection = document.getElementById('queue-section');
  const fileList = document.getElementById('file-list');
  const compressAllBtn = document.getElementById('compress-all-btn');
  const downloadAllBtn = document.getElementById('download-all-btn');
  const clearAllBtn = document.getElementById('clear-all-btn');

  // File Queue State
  let queue = [];

  // Drag and Drop Event Listeners
  dropZone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFiles(e.target.files);
      fileInput.value = ''; // Reset input to allow selecting same file again
    }
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  });

  // Global Action Listeners
  compressAllBtn.addEventListener('click', compressAll);
  downloadAllBtn.addEventListener('click', downloadAll);
  clearAllBtn.addEventListener('click', clearAll);

  // File Handler
  function handleFiles(filesList) {
    let addedCount = 0;

    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      
      // Check if file is already in queue to avoid duplicates
      if (queue.some(item => item.file.name === file.name && item.file.size === file.size)) {
        continue;
      }

      const id = 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

      const item = {
        id: id,
        file: file,
        originalSize: file.size,
        compressedSize: 0,
        compressedBytes: null,
        status: isPDF ? 'ready' : 'error',
        level: 'medium',
        progress: 0,
        statusText: isPDF ? 'Ready' : 'Invalid File',
        error: isPDF ? null : 'Only PDF files are supported.'
      };

      queue.push(item);
      
      const cardEl = createFileCard(item);
      fileList.appendChild(cardEl);

      if (!isPDF) {
        updateCardUI(item);
      }

      addedCount++;
    }

    if (addedCount > 0) {
      queueSection.style.display = 'flex';
    }

    updateGlobalButtons();
  }

  // Create Card Element
  function createFileCard(item) {
    const card = document.createElement('div');
    card.className = 'file-card';
    card.id = `card-${item.id}`;

    const formattedSize = formatBytes(item.originalSize);

    card.innerHTML = `
      <div class="file-info-row">
        <div class="file-details">
          <div class="file-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div class="file-meta">
            <div class="file-name" title="${escapeHtml(item.file.name)}">${escapeHtml(item.file.name)}</div>
            <div class="file-sizes" id="sizes-${item.id}">
              <span>${formattedSize}</span>
            </div>
          </div>
        </div>
        <div class="file-status-badge badge-ready" id="badge-${item.id}">Ready</div>
      </div>
      
      <div class="progress-container" id="progress-container-${item.id}">
        <div class="progress-bar" id="progress-bar-${item.id}"></div>
      </div>
      
      <div class="file-actions-row">
        <div class="level-selector-wrapper">
          <span class="level-label">Compression:</span>
          <select class="level-select" id="level-${item.id}">
            <option value="low">Low (Keep Quality)</option>
            <option value="medium" selected>Medium (Balanced)</option>
            <option value="high">High (Maximum Size Reduction)</option>
          </select>
        </div>
        <div class="file-card-buttons">
          <button class="btn-card-action btn-compress-single" id="btn-compress-${item.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            <span>Compress</span>
          </button>
          <button class="btn-card-action btn-download-single" id="btn-download-${item.id}" style="display: none;">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            <span>Download</span>
          </button>
          <button class="btn-card-action btn-remove-single" id="btn-remove-${item.id}" title="Remove file">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
    `;

    // Card Event Listeners
    const levelSelect = card.querySelector(`#level-${item.id}`);
    levelSelect.addEventListener('change', (e) => {
      item.level = e.target.value;
    });

    const compressBtn = card.querySelector(`#btn-compress-${item.id}`);
    compressBtn.addEventListener('click', () => {
      compressSingleFile(item.id);
    });

    const downloadBtn = card.querySelector(`#btn-download-${item.id}`);
    downloadBtn.addEventListener('click', () => {
      downloadSingleFile(item.id);
    });

    const removeBtn = card.querySelector(`#btn-remove-${item.id}`);
    removeBtn.addEventListener('click', () => {
      removeFromQueue(item.id);
    });

    return card;
  }

  // Update Card UI State
  function updateCardUI(item) {
    const card = document.getElementById(`card-${item.id}`);
    if (!card) return;

    const badge = card.querySelector(`#badge-${item.id}`);
    const sizes = card.querySelector(`#sizes-${item.id}`);
    const progressContainer = card.querySelector(`#progress-container-${item.id}`);
    const levelSelect = card.querySelector(`#level-${item.id}`);
    const compressBtn = card.querySelector(`#btn-compress-${item.id}`);
    const downloadBtn = card.querySelector(`#btn-download-${item.id}`);

    badge.className = 'file-status-badge';

    if (item.status === 'ready') {
      badge.classList.add('badge-ready');
      badge.textContent = 'Ready';
      levelSelect.disabled = false;
      compressBtn.disabled = false;
      compressBtn.style.display = 'flex';
      downloadBtn.style.display = 'none';
      progressContainer.classList.remove('active');
      sizes.innerHTML = `<span>${formatBytes(item.originalSize)}</span>`;
    } 
    else if (item.status === 'compressing') {
      badge.classList.add('badge-compressing');
      badge.textContent = 'Shrinking';
      levelSelect.disabled = true;
      compressBtn.disabled = true;
      progressContainer.classList.add('active');
      sizes.innerHTML = `<span>${formatBytes(item.originalSize)}</span> <span class="size-arrow">→</span> <span class="status-msg" style="color: var(--accent-blue); font-size:11px;">${escapeHtml(item.statusText || 'Processing...')}</span>`;
    } 
    else if (item.status === 'done') {
      badge.classList.add('badge-done');
      badge.textContent = 'Compressed';
      levelSelect.disabled = true;
      compressBtn.style.display = 'none';
      downloadBtn.style.display = 'flex';
      progressContainer.classList.remove('active');

      const savings = Math.round(((item.originalSize - item.compressedSize) / item.originalSize) * 100);
      const savingsText = savings > 0 ? `(-${savings}%)` : `(0%)`;

      sizes.innerHTML = `
        <span>${formatBytes(item.originalSize)}</span>
        <span class="size-arrow">→</span>
        <span>${formatBytes(item.compressedSize)}</span>
        <span class="size-savings">${savingsText}</span>
      `;
    } 
    else if (item.status === 'error') {
      badge.classList.add('badge-error');
      badge.textContent = 'Failed';
      levelSelect.disabled = true;
      compressBtn.disabled = true;
      progressContainer.classList.remove('active');
      sizes.innerHTML = `
        <span>${formatBytes(item.originalSize)}</span>
        <div class="error-message">${escapeHtml(item.error || 'Failed to process.')}</div>
      `;
    }
  }

  // Update Progress Bar & Message
  function updateCardProgress(item) {
    const card = document.getElementById(`card-${item.id}`);
    if (!card) return;

    const progressBar = card.querySelector(`#progress-bar-${item.id}`);
    if (progressBar) {
      progressBar.style.width = `${item.progress}%`;
    }

    const sizes = card.querySelector(`#sizes-${item.id}`);
    if (sizes && item.status === 'compressing') {
      sizes.innerHTML = `<span>${formatBytes(item.originalSize)}</span> <span class="size-arrow">→</span> <span class="status-msg" style="color: var(--accent-blue); font-size:11px;">${escapeHtml(item.statusText || 'Processing...')}</span>`;
    }
  }

  // Update Global Buttons State
  function updateGlobalButtons() {
    const hasReady = queue.some(x => x.status === 'ready');
    const hasDone = queue.some(x => x.status === 'done');
    const isCompressing = queue.some(x => x.status === 'compressing');

    compressAllBtn.disabled = !hasReady || isCompressing;
    downloadAllBtn.disabled = !hasDone || isCompressing;

    queue.forEach(item => {
      const removeBtn = document.getElementById(`btn-remove-${item.id}`);
      if (removeBtn) {
        removeBtn.disabled = isCompressing;
      }
    });
  }

  // Disable all controls during global processing
  function disableGlobalControls(disable) {
    compressAllBtn.disabled = disable;
    downloadAllBtn.disabled = disable || !queue.some(x => x.status === 'done');
    clearAllBtn.disabled = disable;

    queue.forEach(item => {
      const removeBtn = document.getElementById(`btn-remove-${item.id}`);
      if (removeBtn) {
        removeBtn.disabled = disable;
      }
      const levelSelect = document.getElementById(`level-${item.id}`);
      if (levelSelect && item.status === 'ready') {
        levelSelect.disabled = disable;
      }
    });
  }

  // Compress Single File Action
  async function compressSingleFile(id) {
    const item = queue.find(x => x.id === id);
    if (!item || item.status === 'compressing' || item.status === 'done') return;

    item.status = 'compressing';
    item.progress = 5;
    item.statusText = 'Loading PDF...';
    updateCardUI(item);
    updateGlobalButtons();

    try {
      const compressedBytes = await compressPDF(item.file, item.level, (percent, statusText) => {
        item.progress = percent;
        item.statusText = statusText;
        updateCardProgress(item);
      });

      item.status = 'done';
      item.compressedSize = compressedBytes.length;
      item.compressedBytes = compressedBytes;
      updateCardUI(item);
      showToast(`Finished: ${item.file.name}`);
    } catch (err) {
      console.error(err);
      item.status = 'error';
      item.error = err.message || 'Failed to compress PDF.';
      updateCardUI(item);
      showToast(`Error processing: ${item.file.name}`);
    }

    updateGlobalButtons();
  }

  // Compress All Action
  async function compressAll() {
    const readyItems = queue.filter(x => x.status === 'ready');
    if (readyItems.length === 0) return;

    disableGlobalControls(true);

    for (const item of readyItems) {
      await compressSingleFile(item.id);
    }

    disableGlobalControls(false);
    updateGlobalButtons();
  }

  // Download Single Action
  function downloadSingleFile(id) {
    const item = queue.find(x => x.id === id);
    if (!item || !item.compressedBytes) return;

    const blob = new Blob([item.compressedBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    
    const extIndex = item.file.name.lastIndexOf('.pdf');
    const baseName = extIndex !== -1 ? item.file.name.substring(0, extIndex) : item.file.name;
    a.download = `${baseName}_compressed.pdf`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${a.download}`);
  }

  // Download All Action
  async function downloadAll() {
    const doneItems = queue.filter(x => x.status === 'done');
    if (doneItems.length === 0) return;

    if (doneItems.length === 1) {
      downloadSingleFile(doneItems[0].id);
      return;
    }

    showToast("Generating ZIP file...");
    const zip = new JSZip();
    const nameCounts = {};

    doneItems.forEach(item => {
      let name = item.file.name;
      const extIndex = name.lastIndexOf('.pdf');
      const baseName = extIndex !== -1 ? name.substring(0, extIndex) : name;
      let finalName = `${baseName}_compressed.pdf`;

      if (nameCounts[finalName]) {
        nameCounts[finalName]++;
        finalName = `${baseName}_compressed_${nameCounts[finalName]}.pdf`;
      } else {
        nameCounts[finalName] = 1;
      }

      zip.file(finalName, item.compressedBytes);
    });

    try {
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shrink_pdfs_${Date.now()}.zip`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      showToast("ZIP download started!");
    } catch (err) {
      console.error(err);
      showToast("Failed to create ZIP package.");
    }
  }

  // Remove Single Card Action
  function removeFromQueue(id) {
    const index = queue.findIndex(x => x.id === id);
    if (index === -1) return;

    if (queue[index].status === 'compressing') {
      showToast("Cannot remove a file while compressing.");
      return;
    }

    queue.splice(index, 1);
    const card = document.getElementById(`card-${id}`);
    if (card) card.remove();

    if (queue.length === 0) {
      queueSection.style.display = 'none';
    }

    updateGlobalButtons();
  }

  // Clear All Queue Action
  function clearAll() {
    if (queue.some(x => x.status === 'compressing')) {
      showToast("Cannot clear the queue while compressing.");
      return;
    }

    queue = [];
    fileList.innerHTML = '';
    queueSection.style.display = 'none';
    updateGlobalButtons();
    showToast("Queue cleared");
  }

  // ----------------------------------------------------
  // PDF Compression Pipeline Logic
  // ----------------------------------------------------

  async function compressPDF(file, level, progressCallback) {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    progressCallback(10, 'Loading PDF structure...');

    // Load PDF Document
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    
    const pageCount = pdfDoc.getPageCount();
    if (pageCount === 0) {
      throw new Error("This PDF document contains no pages.");
    }

    progressCallback(25, 'Analyzing image streams...');

    // Determine level parameters
    let scale = 0.7;
    let quality = 0.7;
    if (level === 'low') {
      scale = 0.9;
      quality = 0.85;
    } else if (level === 'high') {
      scale = 0.45;
      quality = 0.45;
    }

    // Traverse all indirect objects looking for image streams
    const enumeratedIndirectObjects = pdfDoc.context.enumerateIndirectObjects();
    const totalObjects = enumeratedIndirectObjects.length;
    let processedObjects = 0;
    let imageCount = 0;

    for (const [pdfRef, pdfObject] of enumeratedIndirectObjects) {
      processedObjects++;

      if (pdfObject instanceof PDFLib.PDFRawStream) {
        const dict = pdfObject.dict;
        
        // Dereference Subtype
        const subtype = pdfDoc.context.lookup(dict.get(PDFLib.PDFName.of('Subtype')));
        
        if (subtype === PDFLib.PDFName.of('Image')) {
          // Dereference Filter
          const filter = pdfDoc.context.lookup(dict.get(PDFLib.PDFName.of('Filter')));
          
          const isDCT = filter === PDFLib.PDFName.of('DCTDecode');
          const isDCTArray = filter instanceof PDFLib.PDFArray && 
                             filter.asArray().some(f => pdfDoc.context.lookup(f) === PDFLib.PDFName.of('DCTDecode'));

          if (isDCT || isDCTArray) {
            imageCount++;
            
            // Progress visual
            const pct = 25 + Math.round((processedObjects / totalObjects) * 50);
            progressCallback(Math.min(pct, 75), `Optimizing image #${imageCount}...`);

            try {
              const originalBytes = pdfObject.contents;
              
              // Compress the image stream
              const compressedBytes = await compressImageBytes(originalBytes, scale, quality);

              // Replace the stream content only if the compressed result is smaller
              if (compressedBytes.length < originalBytes.length) {
                const newDict = dict.clone(pdfDoc.context);
                newDict.set(PDFLib.PDFName.of('Length'), PDFLib.PDFNumber.of(compressedBytes.length));

                // Read dimensions
                const widthObj = pdfDoc.context.lookup(dict.get(PDFLib.PDFName.of('Width')));
                const heightObj = pdfDoc.context.lookup(dict.get(PDFLib.PDFName.of('Height')));

                if (widthObj instanceof PDFLib.PDFNumber && heightObj instanceof PDFLib.PDFNumber) {
                  const originalWidth = widthObj.asNumber();
                  const originalHeight = heightObj.asNumber();
                  const newWidth = Math.round(originalWidth * scale);
                  const newHeight = Math.round(originalHeight * scale);

                  newDict.set(PDFLib.PDFName.of('Width'), PDFLib.PDFNumber.of(newWidth));
                  newDict.set(PDFLib.PDFName.of('Height'), PDFLib.PDFNumber.of(newHeight));
                }

                // Assign the new compressed stream to the existing reference in place
                const newStream = PDFLib.PDFRawStream.of(newDict, compressedBytes);
                pdfDoc.context.assign(pdfRef, newStream);
              }
            } catch (err) {
              console.warn(`Could not compress image object (ref: ${pdfRef.toString()}):`, err);
              // Fall back gracefully. The rest of the document is unaffected
            }
          }
        }
      }
    }

    progressCallback(80, 'Removing metadata & unused objects...');

    // Copying pages into a brand new PDFDoc context strips all orphaned/unreferenced 
    // object streams (e.g. original images replaced by compressed versions) 
    // and discards document-level metadata (/Info dict and /Metadata streams)
    const cleanPdfDoc = await PDFLib.PDFDocument.create();
    
    // Copy the page trees safely
    const pageIndices = Array.from({ length: pageCount }, (_, i) => i);
    const copiedPages = await cleanPdfDoc.copyPages(pdfDoc, pageIndices);
    
    copiedPages.forEach((page) => {
      cleanPdfDoc.addPage(page);
    });

    progressCallback(90, 'Applying structure stream compression...');

    // Save with useObjectStreams: true for structural stream deflating
    const finalBytes = await cleanPdfDoc.save({ useObjectStreams: true });
    
    progressCallback(100, 'Done');
    return finalBytes;
  }

  // Compress Image bytes via browser canvas
  function compressImageBytes(bytes, scale, quality) {
    return new Promise((resolve, reject) => {
      const blob = new Blob([bytes], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);

        // Compute new size (maintaining aspect ratio)
        const width = Math.max(1, Math.round(img.naturalWidth * scale));
        const height = Math.max(1, Math.round(img.naturalHeight * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Canvas 2D Context initialization failed"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((resultBlob) => {
          if (!resultBlob) {
            reject(new Error("Canvas serialization failed"));
            return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(new Uint8Array(reader.result));
          };
          reader.onerror = (e) => reject(e);
          reader.readAsArrayBuffer(resultBlob);
        }, 'image/jpeg', quality);
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(new Error("Image decode failed inside browser"));
      };

      img.src = url;
    });
  }

  // ----------------------------------------------------
  // Utility Helper Functions
  // ----------------------------------------------------

  function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    });
  }

  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    if (toast.timeoutId) {
      clearTimeout(toast.timeoutId);
    }

    toast.timeoutId = setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
});
