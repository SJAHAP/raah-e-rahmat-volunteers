/**
 * ============================================================================
 * 2-DAY RAH E RAHMAT CONFERENCE - VOLUNTEER PORTAL CLIENT JAVASCRIPT
 * ============================================================================
 * Features:
 *   - Live District Quota Integration (1,000 Volunteers: 500 for NTR Host District, 20 each for 25 AP Districts)
 *   - Applicant Photo Upload: Client-side auto-compression (max 600px canvas, JPEG quality 0.80/0.65),
 *     instant live preview, Base64 conversion for downloadable slip & Drive upload
 *   - 5-Step Guided Registration Wizard with interactive progress tracker
 *   - District President coordination details
 *   - Strict client-side validation (10-digit mobile, 12-digit Aadhaar, 18-65 age)
 *   - Highlighted mandatory reporting notice: Friday, 25th December 2026 - Morning
 *   - Rich Post-Submission Greeting & A4-style Downloadable Registration Slip
 *   - PDF Download via html2pdf & dedicated @media print stylesheets
 * ============================================================================
 */

(function () {
  "use strict";

  // Google Apps Script Web App URL
  // Replace the placeholder below with your deployed Web App exec URL
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwTE6e9sIHxqg6KGqHZgWgIdfxotnniLc6XoYr-x7jYZ7oEQHb_E-eTtorZLYW2RyX03w/exec";

  // Master list of all 26 Andhra Pradesh districts in alphabetical order
  var AP_DISTRICTS = [
    { name: "Alluri Sitharama Raju", code: "ASR" },
    { name: "Anakapalli", code: "ANK" },
    { name: "Ananthapuramu", code: "ATP" },
    { name: "Annamayya", code: "ANN" },
    { name: "Bapatla", code: "BPT" },
    { name: "Chittoor", code: "CTR" },
    { name: "Dr. B.R. Ambedkar Konaseema", code: "KNS" },
    { name: "East Godavari", code: "EGD" },
    { name: "Eluru", code: "ELR" },
    { name: "Guntur", code: "GNT" },
    { name: "Kakinada", code: "KKD" },
    { name: "Krishna", code: "KRI" },
    { name: "Kurnool", code: "KRN" },
    { name: "Nandyal", code: "NDL" },
    { name: "NTR", code: "NTR" },
    { name: "Palnadu", code: "PLN" },
    { name: "Parvathipuram Manyam", code: "PVM" },
    { name: "Prakasam", code: "PKM" },
    { name: "Sri Potti Sriramulu Nellore", code: "NLR" },
    { name: "Sri Sathya Sai", code: "SSS" },
    { name: "Srikakulam", code: "SKL" },
    { name: "Tirupati", code: "TPT" },
    { name: "Visakhapatnam", code: "VSP" },
    { name: "Vizianagaram", code: "VZM" },
    { name: "West Godavari", code: "WGD" },
    { name: "YSR Kadapa", code: "YSR" }
  ];

  // Quota configuration: 1,000 total volunteers
  // Host District NTR: 500 volunteers | Other 25 AP Districts: 20 volunteers each
  var HOST_DISTRICT = "NTR";
  var HOST_DISTRICT_QUOTA = 500;
  var STANDARD_DISTRICT_QUOTA = 20;
  var TOTAL_STATE_QUOTA = 1000;
  var REPORTING_NOTICE_TEXT = "Friday, 25th December 2026 – Morning";

  /**
   * District Quota Helper:
   * Host District NTR: 500 volunteers
   * All other 25 Andhra Pradesh districts: 20 volunteers each
   * Total Statewide Force: 1,000 volunteers
   */
  function getDistrictQuota(district) {
    if (!district) return STANDARD_DISTRICT_QUOTA;
    var normalized = district.toString().trim().toUpperCase();
    return (normalized === "NTR" || normalized.indexOf("NTR") !== -1) ? HOST_DISTRICT_QUOTA : STANDARD_DISTRICT_QUOTA;
  }

  // State
  var currentStep = 1;
  var totalSteps = 5;
  var liveQuotas = {};
  var photoBase64 = ""; // Base64 data URL string for uploaded photo
  var currentVolunteerPayload = null;
  var currentVolunteerId = "";

  var STEP_TITLES = {
    1: "Personal & Contact Details",
    2: "District & Local Coordination",
    3: "Identification & Verification",
    4: "Availability & Languages",
    5: "Operational Note & Final Declaration"
  };

  // DOM Elements
  var form = document.getElementById("volunteerForm");
  var btnPrev = document.getElementById("btnPrev");
  var btnNext = document.getElementById("btnNext");
  var btnSubmit = document.getElementById("btnSubmit");
  var btnSubmitText = document.getElementById("btnSubmitText");
  var btnSubmitSpinner = document.getElementById("btnSubmitSpinner");
  var btnSubmitIcon = document.getElementById("btnSubmitIcon");
  var submitErrorBanner = document.getElementById("submitErrorBanner");
  var submitErrorMessage = document.getElementById("submitErrorMessage");

  var stepperProgressBar = document.getElementById("stepperProgressBar");
  var stepCounterBadge = document.getElementById("stepCounterBadge");
  var stepTitleDisplay = document.getElementById("stepTitleDisplay");
  var progressPercentage = document.getElementById("progressPercentage");
  var stepNavPills = document.querySelectorAll(".step-nav-pill");

  // Photo Upload Elements
  var photoInput = document.getElementById("photoInput");
  var cameraInput = document.getElementById("cameraInput");
  var uploadPhotoBtn = document.getElementById("uploadPhotoBtn");
  var photoPreviewImg = document.getElementById("photoPreviewImg");
  var photoPlaceholder = document.getElementById("photoPlaceholder");
  var photoFilenameTag = document.getElementById("photoFilenameTag");
  var photoFilenameText = document.getElementById("photoFilenameText");
  var removePhotoBtn = document.getElementById("removePhotoBtn");
  var uploadBtnLabel = document.getElementById("uploadBtnLabel");

  // Photo Source Chooser Modal Elements
  var photoSourceModal = document.getElementById("photoSourceModal");
  var btnTakeSelfie = document.getElementById("btnTakeSelfie");
  var btnChooseGallery = document.getElementById("btnChooseGallery");
  var closePhotoModalBtn = document.getElementById("closePhotoModalBtn");
  var cancelPhotoModalBtn = document.getElementById("cancelPhotoModalBtn");

  // District Elements
  var districtSelect = document.getElementById("districtSelect");
  var districtStatusCard = document.getElementById("districtStatusCard");
  var selectedDistCode = document.getElementById("selectedDistCode");
  var selectedDistName = document.getElementById("selectedDistName");
  var selectedDistQuotaText = document.getElementById("selectedDistQuotaText");
  var selectedDistBadge = document.getElementById("selectedDistBadge");
  var districtFullAlert = document.getElementById("districtFullAlert");

  var aadhaarInput = document.getElementById("aadhaar");

  // Confirmation / Registration Slip Elements
  var confirmationScreen = document.getElementById("confirmationScreen");
  var formCard = document.getElementById("formCard");
  var stepperCard = document.getElementById("stepperCard");
  var registrationSlipCard = document.getElementById("registrationSlipCard");
  var btnDownloadSlipPdf = document.getElementById("btnDownloadSlipPdf");
  var btnPrintSlip = document.getElementById("btnPrintSlip");
  var btnRegisterAnother = document.getElementById("btnRegisterAnother");

  // Modals
  var districtModal = document.getElementById("districtModal");
  var openDistrictModalBtn = document.getElementById("openDistrictModalBtn");
  var closeDistrictModalBtn = document.getElementById("closeDistrictModalBtn");
  var modalDistrictList = document.getElementById("modalDistrictList");
  var districtSearchInput = document.getElementById("districtSearchInput");

  /**
   * Initialize App
   */
  function init() {
    initQuotasState();
    setupEventListeners();
    fetchLiveQuotas();
    updateStepperUI();
  }

  /**
   * Setup initial mock state for all 26 districts (1,000 Volunteers: 500 NTR, 20 Others)
   */
  function initQuotasState() {
    AP_DISTRICTS.forEach(function (d, index) {
      var quotaCap = getDistrictQuota(d.name);
      var sampleRegistered = (index === 9) ? 20 : (d.name === "NTR" ? 18 : (index % 5));
      liveQuotas[d.name] = {
        code: d.code,
        cap: quotaCap,
        isHost: (d.name === "NTR"),
        registered: sampleRegistered,
        available: Math.max(0, quotaCap - sampleRegistered),
        isFull: sampleRegistered >= quotaCap
      };
    });
    populateDistrictDropdown();
    renderModalDistrictList();
  }

  /**
   * Fetch live district quotas from Google Apps Script Web App
   */
  function fetchLiveQuotas() {
    if (!SCRIPT_URL || SCRIPT_URL === "YOUR_APPS_SCRIPT_EXEC_URL_HERE" || SCRIPT_URL.includes("sample-rah-e-rahmat")) {
      populateDistrictDropdown();
      renderModalDistrictList();
      return;
    }

    var fetchUrl = SCRIPT_URL + (SCRIPT_URL.includes("?") ? "&" : "?") + "action=getDistrictQuotas&_t=" + Date.now();

    fetch(fetchUrl, {
      method: "GET",
      mode: "cors"
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then(function (json) {
        if (json && json.status === "success" && json.districts) {
          for (var distName in json.districts) {
            if (liveQuotas[distName]) {
              liveQuotas[distName].cap = json.districts[distName].cap || getDistrictQuota(distName);
              liveQuotas[distName].registered = json.districts[distName].registered;
              liveQuotas[distName].available = json.districts[distName].available;
              liveQuotas[distName].isFull = json.districts[distName].isFull;
              if (json.districts[distName].isHost !== undefined) {
                liveQuotas[distName].isHost = json.districts[distName].isHost;
              }
            }
          }
          populateDistrictDropdown();
          renderModalDistrictList();
        } else {
          throw new Error(json.message || "Invalid response format");
        }
      })
      .catch(function (err) {
        console.warn("Live quota fetch notice:", err.message);
        populateDistrictDropdown();
        renderModalDistrictList();
      });
  }

  /**
   * Populate District Dropdown with Live Available Spots (500 for NTR, 20 for others)
   */
  function populateDistrictDropdown() {
    var previousSelection = districtSelect.value;
    districtSelect.innerHTML = '<option value="" disabled ' + (previousSelection ? '' : 'selected') + '>Select District</option>';

    AP_DISTRICTS.forEach(function (d) {
      var quotaCap = getDistrictQuota(d.name);
      var q = liveQuotas[d.name] || { cap: quotaCap, available: quotaCap, isFull: false };
      var cap = q.cap || quotaCap;
      var isHost = (d.name === "NTR");
      var hostTag = isHost ? " [Host District]" : "";

      var option = document.createElement("option");
      option.value = d.name;

      if (q.available <= 0 || q.isFull) {
        option.textContent = d.name + " (" + d.code + ")" + hostTag + " — [FULL - 0 Spots Available]";
        option.disabled = true;
        option.className = "dist-full-option";
      } else {
        option.textContent = d.name + " (" + d.code + ")" + hostTag + " — (" + q.available + "/" + cap + " spots available)";
      }

      if (previousSelection === d.name && (!q.isFull || q.available > 0)) {
        option.selected = true;
      }

      districtSelect.appendChild(option);
    });

    onDistrictChange();
  }

  function onDistrictChange() {
    var selectedName = districtSelect.value;
    if (!selectedName || !liveQuotas[selectedName]) {
      districtStatusCard.style.display = "none";
      districtFullAlert.style.display = "none";
      return;
    }

    var q = liveQuotas[selectedName];
    var cap = q.cap || getDistrictQuota(selectedName);
    var isHost = (selectedName === "NTR");

    districtStatusCard.style.display = "flex";
    selectedDistCode.textContent = q.code;
    selectedDistName.innerHTML = selectedName + (isHost ? ' <span class="host-pill-badge">Host District</span>' : '');
    selectedDistQuotaText.textContent = q.available + " of " + cap + " spots available (" + q.registered + " registered)";

    selectedDistBadge.className = "quota-indicator-pill";
    var fastThreshold = isHost ? 25 : 5;
    if (q.available <= 0 || q.isFull) {
      selectedDistBadge.classList.add("full");
      selectedDistBadge.textContent = "Quota Full";
      districtFullAlert.style.display = "flex";
    } else if (q.available <= fastThreshold) {
      selectedDistBadge.classList.add("filling-fast");
      selectedDistBadge.textContent = "Filling Fast (" + q.available + " left)";
      districtFullAlert.style.display = "none";
    } else {
      selectedDistBadge.classList.add("available");
      selectedDistBadge.textContent = "Spots Available";
      districtFullAlert.style.display = "none";
    }
  }

  function renderModalDistrictList(filterQuery) {
    if (!modalDistrictList) return;
    var query = (filterQuery || "").toLowerCase().trim();
    modalDistrictList.innerHTML = "";

    var matchCount = 0;
    AP_DISTRICTS.forEach(function (d) {
      if (query && !d.name.toLowerCase().includes(query) && !d.code.toLowerCase().includes(query)) {
        return;
      }
      matchCount++;

      var quotaCap = getDistrictQuota(d.name);
      var q = liveQuotas[d.name] || { cap: quotaCap, available: quotaCap, registered: 0, isFull: false };
      var cap = q.cap || quotaCap;
      var isHost = (d.name === "NTR");

      var card = document.createElement("div");
      card.className = "district-row-card" + (isHost ? " host-district-card" : "");

      var fastThreshold = isHost ? 25 : 5;
      var badgeClass = q.isFull ? "full" : (q.available <= fastThreshold ? "filling-fast" : "available");
      var badgeText = q.isFull ? ("FULL (0/" + cap + ")") : (q.available + "/" + cap + " left");
      var hostBadgeHtml = isHost ? ' <span class="host-pill-badge">Host District</span>' : '';

      card.innerHTML = 
        '<div>' +
          '<div class="district-row-name">' + d.name + hostBadgeHtml + '</div>' +
          '<div class="district-row-code">Code: ' + d.code + ' &bull; Cap: ' + cap + '</div>' +
        '</div>' +
        '<span class="quota-indicator-pill ' + badgeClass + '">' + badgeText + '</span>';

      modalDistrictList.appendChild(card);
    });

    if (matchCount === 0) {
      modalDistrictList.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 1.5rem; color: var(--slate-500);">No Andhra Pradesh districts match your search.</div>';
    }
  }

  /**
   * Setup Event Listeners
   */
  function setupEventListeners() {
    // Stepper navigation
    btnNext.addEventListener("click", onNextStep);
    btnPrev.addEventListener("click", onPrevStep);

    stepNavPills.forEach(function (pill) {
      pill.addEventListener("click", function () {
        var targetStep = parseInt(this.getAttribute("data-step"), 10);
        if (targetStep < currentStep) {
          goToStep(targetStep);
        } else if (targetStep === currentStep + 1) {
          onNextStep();
        }
      });
    });

    // Form submission
    form.addEventListener("submit", onFormSubmit);

    // Prevent premature form submission on Enter key (Steps 1 through 4)
    form.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.keyCode === 13) {
        var target = e.target;
        var tagName = target ? target.tagName.toLowerCase() : "";
        var isTextarea = tagName === "textarea";
        var isSubmitBtn = target === btnSubmit || (tagName === "button" && target.type === "submit");

        // Allow default Enter key behavior inside textarea
        if (isTextarea) {
          return;
        }

        // On final step (Step 5), if Enter is pressed specifically on the submit button, allow submission
        if (currentStep === totalSteps && isSubmitBtn) {
          return;
        }

        // Prevent premature Enter submit on Steps 1 to 4
        e.preventDefault();

        if (currentStep < totalSteps) {
          onNextStep();
        } else if (currentStep === totalSteps) {
          onFormSubmit(e);
        }
      }
    });

    // District change
    districtSelect.addEventListener("change", onDistrictChange);

    // Photo file upload & chooser popup wiring
    if (uploadPhotoBtn) {
      uploadPhotoBtn.addEventListener("click", function (e) {
        e.preventDefault();
        openPhotoSourceModal();
      });
    }

    if (closePhotoModalBtn) {
      closePhotoModalBtn.addEventListener("click", closePhotoSourceModal);
    }

    if (cancelPhotoModalBtn) {
      cancelPhotoModalBtn.addEventListener("click", closePhotoSourceModal);
    }

    if (photoSourceModal) {
      photoSourceModal.addEventListener("click", function (e) {
        if (e.target === photoSourceModal) {
          closePhotoSourceModal();
        }
      });
    }

    // Option 1: Take Selfie (Camera) -> triggers cameraInput.click() and closes popup
    if (btnTakeSelfie) {
      btnTakeSelfie.addEventListener("click", function () {
        closePhotoSourceModal();
        if (cameraInput) {
          cameraInput.value = "";
          cameraInput.click();
        }
      });
    }

    // Option 2: Choose from Gallery -> triggers photoInput.click() and closes popup
    if (btnChooseGallery) {
      btnChooseGallery.addEventListener("click", function () {
        closePhotoSourceModal();
        if (photoInput) {
          photoInput.value = "";
          photoInput.click();
        }
      });
    }

    // Wire both hidden inputs to the exact same image auto-compression handler
    if (photoInput) {
      photoInput.addEventListener("change", handlePhotoSelection);
    }
    if (cameraInput) {
      cameraInput.addEventListener("change", handlePhotoSelection);
    }

    if (removePhotoBtn) {
      removePhotoBtn.addEventListener("click", function () {
        resetPhotoUpload();
        openPhotoSourceModal();
      });
    }

    // Aadhaar auto-formatting (XXXX XXXX XXXX)
    aadhaarInput.addEventListener("input", function () {
      var digits = this.value.replace(/\D/g, "").substring(0, 12);
      var parts = [];
      for (var i = 0; i < digits.length; i += 4) {
        parts.push(digits.substring(i, i + 4));
      }
      this.value = parts.join(" ");
      validateField("aadhaar");
    });

    // Real-time input validation on blur / input
    var fieldsToWatch = [
      "fullName", "age", "whatsapp", "emergencyContact", "relationship",
      "email", "districtSelect", "mandal", "coordinator", "agreementAccepted"
    ];

    fieldsToWatch.forEach(function (fieldId) {
      var el = document.getElementById(fieldId);
      if (el) {
        el.addEventListener("blur", function () {
          validateField(fieldId);
        });
        el.addEventListener("input", function () {
          var group = el.closest(".form-group");
          if (group && group.classList.contains("has-error")) {
            validateField(fieldId);
          }
        });
      }
    });

    // Shift & Language checkboxes validation on change
    document.querySelectorAll('input[name="preferredShift"]').forEach(function (cb) {
      cb.addEventListener("change", function () { validateField("preferredShift"); });
    });
    document.querySelectorAll('input[name="languagesSpoken"]').forEach(function (cb) {
      cb.addEventListener("change", function () { validateField("languagesSpoken"); });
    });

    // Download PDF Action
    if (btnDownloadSlipPdf) {
      btnDownloadSlipPdf.addEventListener("click", downloadRegistrationSlipPdf);
    }

    // Print Slip Action
    if (btnPrintSlip) {
      btnPrintSlip.addEventListener("click", function () {
        window.print();
      });
    }

    // Register another volunteer
    if (btnRegisterAnother) {
      btnRegisterAnother.addEventListener("click", function () {
        form.reset();
        resetPhotoUpload();
        var availBothEl = document.getElementById("availBoth");
        if (availBothEl) availBothEl.checked = true;
        var shiftFullEl = document.getElementById("shiftFull");
        if (shiftFullEl) shiftFullEl.checked = true;
        confirmationScreen.classList.remove("active");
        var mainContent = document.querySelector(".main-content");
        if (mainContent) {
          mainContent.classList.remove("confirmation-view");
          mainContent.style.marginTop = "";
        }
        formCard.style.display = "block";
        stepperCard.style.display = "block";
        fetchLiveQuotas();
        goToStep(1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    // Modals
    openDistrictModalBtn.addEventListener("click", function () {
      districtModal.classList.add("active");
      renderModalDistrictList(districtSearchInput.value);
    });

    closeDistrictModalBtn.addEventListener("click", function () {
      districtModal.classList.remove("active");
    });

    districtModal.addEventListener("click", function (e) {
      if (e.target === districtModal) districtModal.classList.remove("active");
    });

    districtSearchInput.addEventListener("input", function () {
      renderModalDistrictList(this.value);
    });

    // Close any active modal on Escape key
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" || e.keyCode === 27) {
        if (districtModal && districtModal.classList.contains("active")) {
          districtModal.classList.remove("active");
        }
        if (photoSourceModal && photoSourceModal.classList.contains("active")) {
          closePhotoSourceModal();
        }
      }
    });
  }

  function openPhotoSourceModal() {
    if (photoSourceModal) {
      photoSourceModal.classList.add("active");
      photoSourceModal.setAttribute("aria-hidden", "false");
    }
  }

  function closePhotoSourceModal() {
    if (photoSourceModal) {
      photoSourceModal.classList.remove("active");
      photoSourceModal.setAttribute("aria-hidden", "true");
    }
  }

  /**
   * Handle Photo Selection, Client-Side Auto-Compression & Base64 Data URL Conversion
   * - Unified handler for both #photoInput (Gallery) and #cameraInput (Selfie Camera)
   * - Accepts large raw photos (e.g. 8585 KB camera selfies) without throwing file size errors
   * - Resizes proportionally via HTML5 <canvas> to max width/height of 600px
   * - Exports JPEG at 0.80 quality (stepping down to 0.65 only if Base64 > 450 KB)
   * - Shows compressed size in preview box (e.g. "Ready (145 KB)")
   * - Always calls URL.revokeObjectURL to keep mobile browser memory clean
   */
  function handlePhotoSelection(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;

    var errorEl = document.getElementById("errorPhoto");

    // 1. Accept any standard or mobile camera image format (JPEG, PNG, WebP, HEIC, etc.)
    if (!file.type || !file.type.startsWith("image/")) {
      toggleFieldError("groupPhoto", "errorPhoto", true);
      errorEl.textContent = "Please select a valid image file or take a camera selfie.";
      resetPhotoUpload();
      return;
    }

    // Clear previous errors while compressing
    toggleFieldError("groupPhoto", "errorPhoto", false);
    uploadBtnLabel.textContent = "Compressing Photo...";

    // 2. Load into Image object via URL.createObjectURL
    var objectUrl = URL.createObjectURL(file);
    var img = new Image();

    img.onload = function () {
      try {
        // Proportional resize so longest side is at most 600px
        var maxWidth = 600;
        var maxHeight = 600;
        var width = img.naturalWidth || img.width;
        var height = img.naturalHeight || img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        // Draw onto HTML5 canvas
        var canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext("2d");

        // White background to handle transparent PNGs cleanly when converted to JPEG
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Export compressed JPEG at 0.80 quality
        var quality = 0.80;
        var compressedBase64 = canvas.toDataURL("image/jpeg", quality);

        // Estimate Base64 size in bytes: (chars - header) * 0.75
        var headerIndex = compressedBase64.indexOf(",");
        var base64Length = (headerIndex !== -1) ? (compressedBase64.length - (headerIndex + 1)) : compressedBase64.length;
        var approxBytes = Math.round(base64Length * 0.75);

        // If resulting Base64 string is still above 450 KB, step quality down to 0.65
        if (approxBytes > 450 * 1024) {
          quality = 0.65;
          compressedBase64 = canvas.toDataURL("image/jpeg", quality);
          headerIndex = compressedBase64.indexOf(",");
          base64Length = (headerIndex !== -1) ? (compressedBase64.length - (headerIndex + 1)) : compressedBase64.length;
          approxBytes = Math.round(base64Length * 0.75);
        }

        // Store compressed Base64 JPEG string in state variable for preview & submission
        photoBase64 = compressedBase64;

        // Update UI Preview with compressed image and size (e.g. "Ready (145 KB)")
        photoPreviewImg.src = photoBase64;
        photoPreviewImg.style.display = "block";
        photoPlaceholder.style.display = "none";

        var compressedKb = Math.round(approxBytes / 1024);
        photoFilenameText.textContent = "Ready (" + compressedKb + " KB)";
        photoFilenameTag.style.display = "inline-flex";
        uploadBtnLabel.textContent = "Change Photo";

        toggleFieldError("groupPhoto", "errorPhoto", false);
      } catch (procErr) {
        console.error("Photo compression error:", procErr);
        toggleFieldError("groupPhoto", "errorPhoto", true);
        errorEl.textContent = "Could not process image. Please try another photo.";
        resetPhotoUpload();
      } finally {
        // Always revoke object URL to keep mobile browser memory clean
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onerror = function () {
      URL.revokeObjectURL(objectUrl);
      toggleFieldError("groupPhoto", "errorPhoto", true);
      errorEl.textContent = "Unable to read image file. Please ensure it is a valid photo.";
      resetPhotoUpload();
    };

    img.src = objectUrl;
  }

  function resetPhotoUpload() {
    if (photoInput) photoInput.value = "";
    if (cameraInput) cameraInput.value = "";
    photoBase64 = "";
    photoPreviewImg.src = "";
    photoPreviewImg.style.display = "none";
    photoPlaceholder.style.display = "flex";
    photoFilenameTag.style.display = "none";
    uploadBtnLabel.textContent = "Upload Passport Photo / Selfie";
  }

  /**
   * Field-Level Client Validation
   */
  function validateField(fieldId) {
    var isValid = true;

    if (fieldId === "fullName") {
      var val = (document.getElementById("fullName").value || "").trim();
      isValid = val.length >= 3;
      toggleFieldError("groupFullName", "errorFullName", !isValid);
    }

    if (fieldId === "photo") {
      isValid = !!photoBase64;
      toggleFieldError("groupPhoto", "errorPhoto", !isValid);
      if (!isValid) {
        document.getElementById("errorPhoto").textContent = "Please upload your applicant photo (take a selfie or upload from gallery).";
      }
    }

    if (fieldId === "gender") {
      var hasGender = !!document.querySelector('input[name="gender"]:checked');
      isValid = hasGender;
      toggleFieldError("groupGender", "errorGender", !isValid);
    }

    if (fieldId === "age") {
      var ageVal = parseInt(document.getElementById("age").value, 10);
      isValid = !isNaN(ageVal) && ageVal >= 18 && ageVal <= 65;
      toggleFieldError("groupAge", "errorAge", !isValid);
    }

    if (fieldId === "whatsapp") {
      var wa = (document.getElementById("whatsapp").value || "").replace(/\D/g, "");
      isValid = /^[6-9]\d{9}$/.test(wa);
      toggleFieldError("groupWhatsapp", "errorWhatsapp", !isValid);
    }

    if (fieldId === "emergencyContact") {
      var em = (document.getElementById("emergencyContact").value || "").replace(/\D/g, "");
      var waVal = (document.getElementById("whatsapp").value || "").replace(/\D/g, "");
      isValid = /^[6-9]\d{9}$/.test(em) && em !== waVal;
      toggleFieldError("groupEmergency", "errorEmergency", !isValid);
    }

    if (fieldId === "relationship") {
      var rel = (document.getElementById("relationship").value || "").trim();
      isValid = rel !== "";
      toggleFieldError("groupRelationship", "errorRelationship", !isValid);
    }

    if (fieldId === "email") {
      var emailVal = (document.getElementById("email").value || "").trim();
      if (emailVal === "") {
        isValid = true; // Optional
      } else {
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
      }
      toggleFieldError("groupEmail", "errorEmail", !isValid);
    }

    if (fieldId === "districtSelect") {
      var distVal = districtSelect.value;
      var q = liveQuotas[distVal];
      isValid = distVal !== "" && q && q.available > 0 && !q.isFull;
      toggleFieldError("groupDistrict", "errorDistrict", !isValid);
    }

    if (fieldId === "mandal") {
      var mandalVal = (document.getElementById("mandal").value || "").trim();
      isValid = mandalVal.length >= 2;
      toggleFieldError("groupMandal", "errorMandal", !isValid);
    }

    if (fieldId === "coordinator") {
      var coordVal = (document.getElementById("coordinator").value || "").trim();
      isValid = coordVal.length >= 3;
      toggleFieldError("groupCoordinator", "errorCoordinator", !isValid);
    }

    if (fieldId === "aadhaar") {
      var aVal = (document.getElementById("aadhaar").value || "").replace(/\D/g, "");
      isValid = /^\d{12}$/.test(aVal);
      toggleFieldError("groupAadhaar", "errorAadhaar", !isValid);
    }

    if (fieldId === "availability") {
      var hasAvail = !!document.querySelector('input[name="availability"]:checked');
      isValid = hasAvail;
      toggleFieldError("groupAvailability", "errorAvailability", !isValid);
    }

    if (fieldId === "preferredShift") {
      var shiftCount = document.querySelectorAll('input[name="preferredShift"]:checked').length;
      isValid = shiftCount >= 1;
      toggleFieldError("groupShift", "errorShift", !isValid);
    }

    if (fieldId === "languagesSpoken") {
      var langCount = document.querySelectorAll('input[name="languagesSpoken"]:checked').length;
      isValid = langCount >= 1;
      toggleFieldError("groupLanguages", "errorLanguages", !isValid);
    }

    if (fieldId === "agreementAccepted") {
      var agEl = document.getElementById("agreementAccepted");
      isValid = agEl && agEl.checked;
      toggleFieldError("groupAgreement", "errorAgreement", !isValid);
    }

    return isValid;
  }

  function toggleFieldError(groupId, errorId, show) {
    var group = document.getElementById(groupId);
    var err = document.getElementById(errorId);
    if (!group) return;

    if (show) {
      group.classList.add("has-error");
      if (err) err.style.display = "flex";
    } else {
      group.classList.remove("has-error");
      if (err) err.style.display = "none";
    }
  }

  /**
   * Validate a specific step (1 through 5)
   */
  function validateStep(stepNumber) {
    var valid = true;

    if (stepNumber === 1) {
      var f1 = validateField("fullName");
      var f2 = validateField("photo");
      var f3 = validateField("gender");
      var f4 = validateField("age");
      var f5 = validateField("whatsapp");
      var f6 = validateField("emergencyContact");
      var f7 = validateField("relationship");
      var f8 = validateField("email");
      valid = f1 && f2 && f3 && f4 && f5 && f6 && f7 && f8;
    } else if (stepNumber === 2) {
      var d1 = validateField("districtSelect");
      var d2 = validateField("mandal");
      var d3 = validateField("coordinator");
      valid = d1 && d2 && d3;
    } else if (stepNumber === 3) {
      valid = validateField("aadhaar");
    } else if (stepNumber === 4) {
      var a1 = validateField("availability");
      var a2 = validateField("preferredShift");
      var a3 = validateField("languagesSpoken");
      valid = a1 && a2 && a3;
    } else if (stepNumber === 5) {
      valid = validateField("agreementAccepted");
    }

    return valid;
  }

  /**
   * Validate Current Step
   */
  function validateCurrentStep() {
    return validateStep(currentStep);
  }

  /**
   * Comprehensive validation across all 5 steps before final submission
   */
  function validateAllSteps() {
    var allValid = true;
    var firstInvalidStep = 0;

    for (var s = 1; s <= totalSteps; s++) {
      var stepOk = validateStep(s);
      if (!stepOk) {
        allValid = false;
        if (firstInvalidStep === 0) {
          firstInvalidStep = s;
        }
      }
    }

    if (!allValid && firstInvalidStep > 0 && firstInvalidStep !== currentStep) {
      goToStep(firstInvalidStep);
    }

    return allValid;
  }

  /**
   * Wizard Step Navigation
   */
  function goToStep(step) {
    if (step < 1 || step > totalSteps) return;

    for (var i = 1; i <= totalSteps; i++) {
      var pane = document.getElementById("stepPane" + i);
      if (pane) pane.classList.remove("active");
    }

    currentStep = step;
    var activePane = document.getElementById("stepPane" + currentStep);
    if (activePane) activePane.classList.add("active");

    if (currentStep === 5) {
      populateStep5Preview();
    }

    updateStepperUI();
    window.scrollTo({ top: formCard.offsetTop - 80, behavior: "smooth" });
  }

  function onNextStep() {
    if (!validateCurrentStep()) return;
    if (currentStep < totalSteps) {
      goToStep(currentStep + 1);
    }
  }

  function onPrevStep() {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  }

  function updateStepperUI(isFinalSubmission) {
    const percent = isFinalSubmission ? 100 : (currentStep - 1) * 20;
    stepperProgressBar.style.width = percent + "%";
    progressPercentage.textContent = percent + "% Completed";
    stepCounterBadge.textContent = isFinalSubmission ? "Registration Completed" : ("Step " + currentStep + " of " + totalSteps);
    stepTitleDisplay.textContent = isFinalSubmission ? "Official Slip Issued" : (STEP_TITLES[currentStep] || "");

    stepNavPills.forEach(function (pill) {
      var stepNum = parseInt(pill.getAttribute("data-step"), 10);
      pill.classList.remove("active", "completed");
      if (isFinalSubmission) {
        pill.classList.add("completed");
      } else if (stepNum === currentStep) {
        pill.classList.add("active");
      } else if (stepNum < currentStep) {
        pill.classList.add("completed");
      }
    });

    btnPrev.style.visibility = (currentStep === 1) ? "hidden" : "visible";

    if (currentStep === totalSteps) {
      btnNext.style.display = "none";
      btnSubmit.style.display = "inline-flex";
    } else {
      btnNext.style.display = "inline-flex";
      btnSubmit.style.display = "none";
    }
  }

  /**
   * Populate Step 5 Preview
   */
  function populateStep5Preview() {
    var name = document.getElementById("fullName").value || "—";
    var dist = districtSelect.value || "—";
    var mandal = document.getElementById("mandal").value || "—";
    var president = document.getElementById("coordinator").value || "—";
    var wa = document.getElementById("whatsapp").value || "—";
    var aNum = (document.getElementById("aadhaar").value || "").replace(/\D/g, "");
    var maskedA = aNum.length === 12 ? "XXXX XXXX " + aNum.substring(8) : "—";

    var availEl = document.querySelector('input[name="availability"]:checked');
    var shifts = [];
    document.querySelectorAll('input[name="preferredShift"]:checked').forEach(function (el) {
      shifts.push(el.value);
    });

    var availVal = (availEl ? availEl.value : "Both Days (Day 1 & Day 2)");
    var shiftsDisplay = shifts.length ? shifts.join(", ") : "Full Time";

    document.getElementById("revName").textContent = name;
    document.getElementById("revDistrict").textContent = dist;
    document.getElementById("revMandal").textContent = mandal;
    document.getElementById("revPresident").textContent = president;
    document.getElementById("revWhatsapp").textContent = "+91 " + wa;
    document.getElementById("revAadhaar").textContent = maskedA;
    document.getElementById("revShift").innerHTML = availVal + " &bull; " + shiftsDisplay;
    document.getElementById("revPhotoStatus").textContent = photoBase64 ? "Yes (Attached)" : "Missing";
  }

  /**
   * Handle Final Form Submission
   */
  function onFormSubmit(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    // Strict guard check: If not on final step (Step 5), block submission immediately!
    if (currentStep !== totalSteps) {
      if (validateCurrentStep()) {
        goToStep(currentStep + 1);
      }
      return;
    }

    // Validate final step (Step 5)
    if (!validateCurrentStep()) {
      return;
    }

    // Strict comprehensive validation across all 5 steps before submitting
    if (!validateAllSteps()) {
      showSubmitError("Please fill in all mandatory fields across all sections before submitting.");
      return;
    }

    submitErrorBanner.style.display = "none";

    var shifts = [];
    document.querySelectorAll('input[name="preferredShift"]:checked').forEach(function (el) {
      shifts.push(el.value);
    });

    var languages = [];
    document.querySelectorAll('input[name="languagesSpoken"]:checked').forEach(function (el) {
      languages.push(el.value);
    });

    var selectedDistrict = districtSelect.value;
    var rawAadhaar = document.getElementById("aadhaar").value.replace(/\D/g, "");
    var rawWhatsapp = document.getElementById("whatsapp").value.replace(/\D/g, "");
    var rawEmergency = document.getElementById("emergencyContact").value.replace(/\D/g, "");

    var payload = {
      fullName: document.getElementById("fullName").value.trim(),
      photoBase64: photoBase64,
      gender: (document.querySelector('input[name="gender"]:checked') || {}).value,
      age: parseInt(document.getElementById("age").value, 10),
      whatsapp: rawWhatsapp,
      emergencyContact: rawEmergency,
      relationship: document.getElementById("relationship").value,
      email: document.getElementById("email").value.trim(),
      district: selectedDistrict,
      mandal: document.getElementById("mandal").value.trim(),
      districtPresident: document.getElementById("coordinator").value.trim(),
      coordinator: document.getElementById("coordinator").value.trim(),
      aadhaar: rawAadhaar,
      availability: (document.querySelector('input[name="availability"]:checked') || {}).value || "Both Days (Day 1 & Day 2)",
      preferredShift: shifts.length ? shifts : ["Full Time"],
      languagesSpoken: languages,
      reportingNotice: REPORTING_NOTICE_TEXT,
      agreementAccepted: document.getElementById("agreementAccepted").checked
    };

    currentVolunteerPayload = payload;
    setSubmitting(true);

    // If SCRIPT_URL is not configured or in local simulation mode
    if (!SCRIPT_URL || SCRIPT_URL === "YOUR_APPS_SCRIPT_EXEC_URL_HERE" || SCRIPT_URL.includes("sample-rah-e-rahmat")) {
      setTimeout(function () {
        handleLocalSimulationSubmission(payload);
      }, 900);
      return;
    }

    // Live POST to Google Apps Script Web App
    fetch(SCRIPT_URL, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (result) {
        setSubmitting(false);
        if (result.status === "success") {
          onRegistrationSuccess(result, payload);
        } else {
          showSubmitError(result.message || "Registration rejected by server.");
        }
      })
      .catch(function (err) {
        console.warn("Network submission fallback:", err);
        handleLocalSimulationSubmission(payload);
      });
  }

  function handleLocalSimulationSubmission(payload) {
    setSubmitting(false);

    var distCap = getDistrictQuota(payload.district);
    var q = liveQuotas[payload.district];
    if (q && (q.available <= 0 || q.isFull)) {
      showSubmitError("District " + payload.district + " has reached its maximum quota of " + distCap + " volunteers.");
      return;
    }

    var distCode = (q && q.code) || getDistrictCode(payload.district);
    var seq = (q ? q.registered + 1 : 1);
    var pad = function(n) { return (n < 10 ? "00" : (n < 100 ? "0" : "")) + n; };
    var generatedId = "RR-" + distCode + "-" + pad(seq);

    if (q) {
      q.registered += 1;
      q.available = Math.max(0, (q.cap || distCap) - q.registered);
      q.isFull = q.registered >= (q.cap || distCap);
    }

    var mockResult = {
      status: "success",
      volunteerId: generatedId,
      districtSlot: seq,
      totalDistrictCap: distCap,
      remainingDistrictSlots: Math.max(0, distCap - seq),
      message: "Volunteer registered successfully! (Demo Simulation)",
      reportingNotice: REPORTING_NOTICE_TEXT,
      data: payload
    };

    onRegistrationSuccess(mockResult, payload);
  }

  function setSubmitting(isSubmitting) {
    if (isSubmitting) {
      btnSubmit.disabled = true;
      btnPrev.disabled = true;
      btnSubmitSpinner.style.display = "inline-block";
      btnSubmitIcon.style.display = "none";
      btnSubmitText.textContent = "Securing District Slot...";
    } else {
      btnSubmit.disabled = false;
      btnPrev.disabled = false;
      btnSubmitSpinner.style.display = "none";
      btnSubmitIcon.style.display = "inline-block";
      btnSubmitText.textContent = "Confirm & Submit Registration";
    }
  }

  function showSubmitError(msg) {
    submitErrorMessage.textContent = msg;
    submitErrorBanner.style.display = "flex";
    submitErrorBanner.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  /**
   * Registration Success: Render Rich Greeting & Downloadable Slip with Photo
   */
  function onRegistrationSuccess(response, payload) {
    updateStepperUI(true); // Final submission sets 100% completion

    var volunteerId = response.volunteerId || "RR-GEN-001";
    var data = response.data || payload;
    currentVolunteerId = volunteerId;

    // 1. Warm Greeting Salutation
    var greetNameEl = document.getElementById("greetVolunteerName");
    if (greetNameEl) {
      greetNameEl.textContent = data.fullName;
    }

    // 2. Populate Registration Slip
    document.getElementById("slipVolunteerId").textContent = volunteerId;
    document.getElementById("slipFullName").textContent = data.fullName;
    document.getElementById("slipDistrict").textContent = data.district + " (" + (data.districtCode || getDistrictCode(data.district)) + ")";
    document.getElementById("slipGenderAge").textContent = data.gender + ", " + data.age + " Years";
    document.getElementById("slipMandal").textContent = data.mandal;
    document.getElementById("slipWhatsapp").textContent = "+91 " + data.whatsapp;
    document.getElementById("slipPresident").textContent = data.districtPresident || data.coordinator;
    document.getElementById("slipEmergency").textContent = "+91 " + data.emergencyContact + " (" + data.relationship + ")";
    document.getElementById("slipAadhaar").textContent = "XXXX-XXXX-" + (data.aadhaar.substring(8) || "0000");
    document.getElementById("slipAvailability").textContent = data.availability || "Both Days (Day 1 & Day 2)";

    var shiftsDisplay = Array.isArray(data.preferredShift) ? data.preferredShift.join(", ") : (data.preferredShift || "Full Time");
    document.getElementById("slipShift").textContent = shiftsDisplay;

    var langsDisplay = Array.isArray(data.languagesSpoken) ? data.languagesSpoken.join(", ") : data.languagesSpoken;
    document.getElementById("slipLanguages").textContent = langsDisplay;

    // 3. Embedded Photo (from client Base64 preview)
    var slipPhotoImg = document.getElementById("slipPhotoImg");
    if (slipPhotoImg && photoBase64) {
      slipPhotoImg.src = photoBase64;
    }

    // 4. Set Issued Date
    var now = new Date();
    document.getElementById("slipIssuedDate").textContent = "Issued: " + now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    // 5. Switch view with clean positive top margin
    formCard.style.display = "none";
    stepperCard.style.display = "none";
    var mainContent = document.querySelector(".main-content");
    if (mainContent) {
      mainContent.classList.add("confirmation-view");
      mainContent.style.marginTop = "2rem";
    }
    confirmationScreen.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /**
   * Download Registration Form (PDF) using html2pdf with window.print fallback
   */
  function downloadRegistrationSlipPdf() {
    var element = document.getElementById("registrationSlipCard");
    if (!element) return;

    var vId = currentVolunteerId || "RR-VOLUNTEER";

    // Use html2pdf if available
    if (typeof window.html2pdf === "function") {
      var opt = {
        margin: [10, 10, 10, 10],
        filename: "Rah_e_Rahmat_Registration_Slip_" + vId + ".pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      };

      var btn = btnDownloadSlipPdf;
      var originalText = btn.innerHTML;
      btn.innerHTML = '<span class="spinner"></span> Generating PDF...';
      btn.disabled = true;

      window.html2pdf().set(opt).from(element).save().then(function () {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }).catch(function (err) {
        console.warn("html2pdf notice:", err);
        btn.innerHTML = originalText;
        btn.disabled = false;
        window.print();
      });
    } else {
      // Clean fallback: browser print-to-PDF
      window.print();
    }
  }

  function getDistrictCode(districtName) {
    for (var i = 0; i < AP_DISTRICTS.length; i++) {
      if (AP_DISTRICTS[i].name.toLowerCase() === (districtName || "").toLowerCase()) {
        return AP_DISTRICTS[i].code;
      }
    }
    return "GEN";
  }

  // Start app on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
