const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
const tools = document.getElementById("tools");
const lineTool = document.getElementById("lineTool");
const clockwiseTool = document.getElementById("clockwiseTool");
const anticlockwiseTool = document.getElementById("anticlockwiseTool");
const coordinatesSpan = document.getElementById("coordinates");
const radiusSpan = document.getElementById("radius");

let isDrawing = false;
let startPoint = { x: 0, y: 0 };
let endPoint = { x: 0, y: 0 };
let curves = [];
let curRadius = 50;

let image = new Image();

function resizeCanvasToDisplaySize(canvas) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    return true;
  }

  return false;
}

resizeCanvasToDisplaySize(canvas);

function drawLine(start, end) {
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
  context.closePath();
}

function calcCenterOfArc(start, end, radius, e) {
  const d = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
  const u = (end.x - start.x) / d;
  const v = (end.y - start.y) / d;
  const h = Math.sqrt(radius ** 2 - d ** 2 / 4);
  return {
    x: (end.x + start.x) / 2 - e * h * v,
    y: (end.y + start.y) / 2 + e * h * u,
  };
}

function drawClockwiseCurve(start, end, radius) {
  context.beginPath();

  const center = calcCenterOfArc(start, end, radius, 1);

  const startAngle = Math.atan2(start.y - center.y, start.x - center.x);
  const endAngle = Math.atan2(end.y - center.y, end.x - center.x);

  context.arc(center.x, center.y, radius, startAngle, endAngle, false);

  context.stroke();
  context.closePath();
}

function drawAnticlockwiseCurve(start, end, radius) {
  context.beginPath();

  const center = calcCenterOfArc(start, end, radius, -1);

  const startAngle = Math.atan2(start.y - center.y, start.x - center.x);
  const endAngle = Math.atan2(end.y - center.y, end.x - center.x);

  context.arc(center.x, center.y, radius, startAngle, endAngle, true);

  context.stroke();
  context.closePath();
}

// Event listeners for tools
let selectedTool = "line"; // Default to the straight line tool

lineTool.addEventListener("click", () => {
  selectedTool = "line";
});

clockwiseTool.addEventListener("click", () => {
  selectedTool = "clockwise";
});

anticlockwiseTool.addEventListener("click", () => {
  selectedTool = "anticlockwise";
});

function getCanvasPosition(event) {
  const canvasRect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - canvasRect.left,
    y: event.clientY - canvasRect.top,
  };
}

let isDrawingLine = false;

canvas.addEventListener("mousedown", (e) => {
  const canvasPos = getCanvasPosition(e);
  if (selectedTool === "line") {
    isDrawingLine = !isDrawingLine; // Toggle drawing state for straight lines
    if (isDrawingLine) {
      startPoint = autoSnap({ ...canvasPos });
    } else {
      endPoint = { ...canvasPos };
      drawLine(startPoint, endPoint);
      curves.push({
        type: "line",
        start: { ...startPoint },
        end: { ...endPoint },
      });
    }
  } else {
    isDrawing = true;
    startPoint = autoSnap(canvasPos);

    endPoint = { ...canvasPos };
  }
});

function drawArcPreview() {
  const d = Math.sqrt(
    (endPoint.x - startPoint.x) ** 2 + (endPoint.y - startPoint.y) ** 2
  );
  if (curRadius < d / 2) {
    curRadius = d / 2;
  }

  if (selectedTool === "clockwise") {
    drawCurves();
    drawClockwiseCurve(startPoint, endPoint, curRadius);
  } else if (selectedTool === "anticlockwise") {
    drawCurves();
    drawAnticlockwiseCurve(startPoint, endPoint, curRadius);
  }
}
canvas.addEventListener("mousemove", (e) => {
  const canvasPos = getCanvasPosition(e);
  endPoint = autoSnap({ ...canvasPos });
  if (isDrawing && selectedTool !== "line") {
    drawArcPreview();
  } else if (isDrawingLine) {
    drawCurves();
    drawLine(startPoint, endPoint);
  }

  coordinatesSpan.textContent = `(${canvasPos.x.toFixed(
    0
  )}, ${canvasPos.y.toFixed(0)})`;
  radiusSpan.textContent = `${curRadius.toFixed(2)}`;
});

// Function to draw all curves and lines in the curves array
function drawCurves() {
  context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

  // Draw the image if it exists
  if (image.src) {
    // opacity 0.5
    context.globalAlpha = 0.5;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    context.globalAlpha = 1;
  }

  // Draw all curves in the curves array

  for (const curve of curves) {
    if (curve.type === "line") {
      drawLine(curve.start, curve.end);
    } else if (curve.type === "clockwise") {
      drawClockwiseCurve(curve.start, curve.end, curve.radius);
    } else if (curve.type === "anticlockwise") {
      drawAnticlockwiseCurve(curve.start, curve.end, curve.radius);
    }
  }
}

canvas.addEventListener("mouseup", (e) => {
  endPoint = autoSnap(getCanvasPosition(e));

  if (isDrawing && selectedTool !== "line") {
    isDrawing = false;
    // Store the drawn curve in the curves array
    const d = Math.sqrt(
      (endPoint.x - startPoint.x) ** 2 + (endPoint.y - startPoint.y) ** 2
    );
    if (curRadius < d / 2) {
      curRadius = d / 2;
    }

    curves.push({
      type: selectedTool,
      start: { ...startPoint },
      end: { ...endPoint },
      radius: curRadius,
    });
  } else if (isDrawingLine) {
    // Finalize the straight line
    isDrawingLine = false;

    drawLine(startPoint, endPoint);
    curves.push({
      type: "line",
      start: { ...startPoint },
      end: { ...endPoint },
    });
  }
  drawCurves();
  // console.log(curves);
});

canvas.addEventListener("wheel", (e) => {
  if (selectedTool === "clockwise" || selectedTool === "anticlockwise") {
    // If the circle tool is selected, adjust the radius based on the scroll direction
    const delta = e.deltaY;
    const radiusStep = 0.06 * curRadius;

    if (delta > 0) {
      // Scroll down to decrease the radius
      curRadius -= radiusStep;
    } else {
      // Scroll up to increase the radius
      curRadius += radiusStep;
    }

    // Ensure the radius is within a reasonable range

    if (curRadius > 10000) {
      curRadius = 10000;
    }

    // Update the coordinates box to display the adjusted radius
    radiusSpan.textContent = `${curRadius.toFixed(2)}`;

    // Redraw the circle with the adjusted radius
    if (isDrawing) {
      drawArcPreview();
    }
  }
});

const clearButton = document.getElementById("clearButton");

clearButton.addEventListener("click", () => {
  context.clearRect(0, 0, canvas.width, canvas.height);

  curves.length = 0;
});

const exportButton = document.getElementById("exportButton");

exportButton.addEventListener("click", () => {
  // Disable the button to prevent multiple clicks
  const exportButton = document.getElementById("exportButton");
  exportButton.disabled = true;

  exportButton.textContent = "Exporting...";

  const info = {
    canvas_width: canvas.width,
    canvas_height: canvas.height,
    x: 100,
    y: 100,
    z: 10,
    speed: 1000,
    feed: 50,
  };
  // TODO: change this when I host backend ;-;
  // "https://cncanvasbackend.cwswastik2005.repl.co"
  // PLEASE DO NOT FORGET A / AT THE END OF THE URL CORS SMH
  const apiUrl =
    "https://0befbed3-5ba4-4003-87dd-d94ec8d46fbf-00-1f6kzxkpyp3ik.asia-b.replit.dev/generate_gcode/"; //"http://127.0.0.1:5000/generate_gcode/";
  fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify([info, ...curves]),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      // console.log("Generated G-code:", data.gcode);
      showPopup(data.transaction_code, data.price);
      exportButton.disabled = false;
      exportButton.textContent = "Export";
    })
    .catch((error) => {
      console.error("Export request failed:", error);

      exportButton.disabled = false;
      exportButton.textContent = "Export";
      alert("Export failed. Please try again later.");
    });
});

const undoButton = document.getElementById("undoButton");

function undo() {
  curves.pop();
  drawCurves();
}

undoButton.addEventListener("click", () => {
  undo();
});

document.addEventListener("keydown", function (event) {
  if ((event.ctrlKey || event.metaKey) && event.key === "z") {
    // Check for Control (or Command on Mac) key and Z key press
    undo();
    event.preventDefault(); // Prevent the browser's default behavior (e.g., undoing text input)
  }
});

const autoSnapCheckbox = document.getElementById("autoSnapCheckbox");
let isAutoSnapEnabled = true;

autoSnapCheckbox.addEventListener("change", function () {
  isAutoSnapEnabled = autoSnapCheckbox.checked;
});

function autoSnap(point) {
  // Snap to a curve's start or end point if auto-snap is enabled
  // and the distance between point and that curve's start/end point is small enough
  if (isAutoSnapEnabled) {
    let minDist = Infinity;
    for (const curve of curves) {
      const d1 = Math.sqrt(
        (point.x - curve.start.x) ** 2 + (point.y - curve.start.y) ** 2
      );
      const d2 = Math.sqrt(
        (point.x - curve.end.x) ** 2 + (point.y - curve.end.y) ** 2
      );
      if (d1 < 15 && d1 < minDist) {
        point = { ...curve.start };
        minDist = d1;
      } else if (d2 < 15 && d2 < minDist) {
        point = { ...curve.end };
        minDist = d2;
      }
    }
  }
  return point;
}

function showPopup(transactionCode, price) {
  const popupContainer = document.getElementById("popupContainer");
  popupContainer.style.display = "flex";

  document.getElementById("transactionCode").textContent = transactionCode;
  document.getElementById("price").textContent = price;
}

function closePopup() {
  const popupContainer = document.getElementById("popupContainer");
  popupContainer.style.display = "none";
}

document.getElementById("closeButton").addEventListener("click", closePopup);

document.getElementById("viewGCodeButton").addEventListener("click", () => {
  window.open(
    "/view_gcode.html?id=" +
      document.getElementById("transactionCode").textContent
  );
});

if (window.innerWidth < 768) {
  const mobileNote = document.getElementById("mobileNote");
  mobileNote.style.display = "flex";
}

const addImageButton = document.getElementById("addImageButton");
const fileInput = document.getElementById("fileInput");

addImageButton.addEventListener("click", () => {
  // open the file dialog
  fileInput.click();
});

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function (event) {
    image.src = event.target.result;
    setTimeout(() => {
      drawCurves();
    }, 100);
  };
  reader.readAsDataURL(file);
});
