(() => {
  const STORAGE_KEY = "icontxt-theme";
  const CANVAS_SIZE = 1024;
  const MAX_TEXT_WIDTH_RATIO = 0.86;
  const MIN_FONT_SIZE = 40;
  const MAX_FONT_SIZE = 700;
  const MIN_LINE_HEIGHT = 0.8;
  const MAX_LINE_HEIGHT = 2;

  const els = {
    canvas: document.getElementById("iconCanvas"),
    text: document.getElementById("iconText"),
    backgroundColor: document.getElementById("backgroundColor"),
    fontColor: document.getElementById("fontColor"),
    fontFamily: document.getElementById("fontFamily"),
    fontSize: document.getElementById("fontSize"),
    fontSizeValue: document.getElementById("fontSizeValue"),
    lineHeight: document.getElementById("lineHeight"),
    lineHeightValue: document.getElementById("lineHeightValue"),
    isBold: document.getElementById("isBold"),
    isItalic: document.getElementById("isItalic"),
    textAlign: document.getElementById("textAlign"),
    positionX: document.getElementById("positionX"),
    positionY: document.getElementById("positionY"),
    positionXValue: document.getElementById("positionXValue"),
    positionYValue: document.getElementById("positionYValue"),
    warning: document.getElementById("textWarning"),
    downloadBtn: document.getElementById("downloadBtn"),
    themeToggle: document.getElementById("themeToggle")
  };

  const ctx = els.canvas.getContext("2d", { alpha: false });

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function getTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
      return saved;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    document.body.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
    els.themeToggle.textContent = theme === "dark" ? "Switch to Light" : "Switch to Dark";
  }

  function getState() {
    const fontSize = clamp(Number(els.fontSize.value), MIN_FONT_SIZE, MAX_FONT_SIZE);
    const lineHeight = clamp(Number(els.lineHeight.value), MIN_LINE_HEIGHT, MAX_LINE_HEIGHT);

    return {
      text: els.text.value,
      backgroundColor: els.backgroundColor.value,
      fontColor: els.fontColor.value,
      fontFamily: els.fontFamily.value,
      fontSize,
      lineHeight,
      isBold: els.isBold.checked,
      isItalic: els.isItalic.checked,
      textAlign: els.textAlign.value,
      positionX: clamp(Number(els.positionX.value), 0, 100),
      positionY: clamp(Number(els.positionY.value), 0, 100)
    };
  }

  function resolveFontString({ isBold, isItalic, fontSize, fontFamily }) {
    const style = isItalic ? "italic" : "normal";
    const weight = isBold ? "700" : "400";
    return `${style} ${weight} ${fontSize}px \"${fontFamily}\", sans-serif`;
  }

  function getPositionPx(percent) {
    return (percent / 100) * CANVAS_SIZE;
  }

  function trimBoundaryEmptyLines(lines) {
    let start = 0;
    let end = lines.length - 1;

    while (start <= end && lines[start].trim() === "") {
      start += 1;
    }

    while (end >= start && lines[end].trim() === "") {
      end -= 1;
    }

    return start > end ? [] : lines.slice(start, end + 1);
  }

  function getContentLines(rawText) {
    const normalized = rawText.replace(/\r\n?/g, "\n");
    return trimBoundaryEmptyLines(normalized.split("\n"));
  }

  function measureTextBlock(state, lines, fontSize) {
    ctx.font = resolveFontString({ ...state, fontSize });

    const widths = lines.map((line) => (line ? ctx.measureText(line).width : 0));
    const maxWidth = widths.length ? Math.max(...widths) : 0;
    const lineAdvance = fontSize * state.lineHeight;
    const height = lineAdvance * lines.length;

    return { maxWidth, lineAdvance, height };
  }

  function fitFontSizeToSafeArea(state, lines, requestedSize) {
    const safeSize = CANVAS_SIZE * MAX_TEXT_WIDTH_RATIO;
    let size = requestedSize;
    let measurement = measureTextBlock(state, lines, size);

    while (
      size > MIN_FONT_SIZE
      && (measurement.maxWidth > safeSize || measurement.height > safeSize)
    ) {
      size -= 1;
      measurement = measureTextBlock(state, lines, size);
    }

    return { fontSize: size, measurement, hitMin: size === MIN_FONT_SIZE };
  }

  function drawIcon() {
    const state = getState();

    els.fontSize.value = String(state.fontSize);
    els.fontSizeValue.value = `${state.fontSize} px`;
    els.lineHeight.value = String(state.lineHeight);
    els.lineHeightValue.value = state.lineHeight.toFixed(2);
    els.positionXValue.value = `${state.positionX}%`;
    els.positionYValue.value = `${state.positionY}%`;

    ctx.save();

    // Fill the full canvas first to guarantee opaque export with no transparent pixels.
    ctx.globalAlpha = 1;
    ctx.fillStyle = state.backgroundColor;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const lines = getContentLines(state.text);
    if (lines.length === 0) {
      els.warning.textContent = "Text is empty. Export will include only the background color.";
      ctx.restore();
      return;
    }

    const { fontSize: computedSize, measurement, hitMin } = fitFontSizeToSafeArea(state, lines, state.fontSize);
    const safeSize = CANVAS_SIZE * MAX_TEXT_WIDTH_RATIO;
    const needsFit = computedSize < state.fontSize;
    const stillOverflows = measurement.maxWidth > safeSize || measurement.height > safeSize;

    ctx.fillStyle = state.fontColor;
    ctx.textBaseline = "top";
    ctx.textAlign = state.textAlign;
    ctx.font = resolveFontString({ ...state, fontSize: computedSize });

    const x = getPositionPx(state.positionX);
    const centerY = getPositionPx(state.positionY);
    const firstLineY = centerY - (measurement.height / 2);

    if (stillOverflows && hitMin) {
      els.warning.textContent = "Text hit minimum font size and may still overflow the safe area.";
    } else if (needsFit) {
      els.warning.textContent = "Text block was auto-scaled to fit the safe area.";
    } else {
      els.warning.textContent = "";
    }

    lines.forEach((line, index) => {
      const y = firstLineY + (index * measurement.lineAdvance);
      ctx.fillText(line, x, y);
    });

    ctx.restore();
  }

  function downloadPng() {
    drawIcon();
    const link = document.createElement("a");
    link.download = "app-icon-1024.png";
    link.href = els.canvas.toDataURL("image/png");
    link.click();
  }

  function bindEvents() {
    const redrawEvents = ["input", "change"];
    const redrawTargets = [
      els.text,
      els.backgroundColor,
      els.fontColor,
      els.fontFamily,
      els.fontSize,
      els.lineHeight,
      els.isBold,
      els.isItalic,
      els.textAlign,
      els.positionX,
      els.positionY
    ];

    redrawTargets.forEach((target) => {
      redrawEvents.forEach((eventName) => {
        target.addEventListener(eventName, drawIcon);
      });
    });

    els.downloadBtn.addEventListener("click", downloadPng);
    els.themeToggle.addEventListener("click", () => {
      const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
    });
  }

  function init() {
    applyTheme(getTheme());
    bindEvents();
    drawIcon();
  }

  init();
})();
