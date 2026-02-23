(() => {
  const STORAGE_KEY = "icontxt-theme";
  const CANVAS_SIZE = 1024;
  const MAX_TEXT_WIDTH_RATIO = 0.86;
  const MIN_FONT_SIZE = 40;
  const MAX_FONT_SIZE = 700;

  const els = {
    canvas: document.getElementById("iconCanvas"),
    text: document.getElementById("iconText"),
    backgroundColor: document.getElementById("backgroundColor"),
    fontColor: document.getElementById("fontColor"),
    fontFamily: document.getElementById("fontFamily"),
    fontSize: document.getElementById("fontSize"),
    fontSizeValue: document.getElementById("fontSizeValue"),
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

    return {
      text: els.text.value,
      backgroundColor: els.backgroundColor.value,
      fontColor: els.fontColor.value,
      fontFamily: els.fontFamily.value,
      fontSize,
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

  function drawIcon() {
    const state = getState();
    const maxTextWidth = CANVAS_SIZE * MAX_TEXT_WIDTH_RATIO;

    els.fontSize.value = String(state.fontSize);
    els.fontSizeValue.value = `${state.fontSize} px`;
    els.positionXValue.value = `${state.positionX}%`;
    els.positionYValue.value = `${state.positionY}%`;

    ctx.save();

    // Fill the full canvas first to guarantee opaque export with no transparent pixels.
    ctx.globalAlpha = 1;
    ctx.fillStyle = state.backgroundColor;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const text = state.text.trim();
    if (!text) {
      els.warning.textContent = "Text is empty. Export will include only the background color.";
      ctx.restore();
      return;
    }

    let computedSize = state.fontSize;
    ctx.font = resolveFontString({ ...state, fontSize: computedSize });
    let measuredWidth = ctx.measureText(text).width;

    if (measuredWidth > maxTextWidth) {
      const ratio = maxTextWidth / measuredWidth;
      computedSize = clamp(Math.floor(computedSize * ratio), MIN_FONT_SIZE, state.fontSize);
      ctx.font = resolveFontString({ ...state, fontSize: computedSize });
      measuredWidth = ctx.measureText(text).width;
      els.warning.textContent = "Text was auto-scaled to fit the icon width.";
    } else {
      els.warning.textContent = "";
    }

    ctx.fillStyle = state.fontColor;
    ctx.textBaseline = "middle";
    ctx.textAlign = state.textAlign;
    ctx.font = resolveFontString({ ...state, fontSize: computedSize });

    const x = getPositionPx(state.positionX);
    const y = getPositionPx(state.positionY);

    if (measuredWidth > maxTextWidth && computedSize === MIN_FONT_SIZE) {
      els.warning.textContent = "Text is very long and may still appear tight at minimum font size.";
    }

    ctx.fillText(text, x, y);
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
