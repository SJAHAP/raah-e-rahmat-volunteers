# Subai Jamait Ahle Hadees Andhra Pradesh — 2-Day Grand Raah e Rahmat Conference

A complete, production-ready web application for volunteer registration for the **2-Day Grand Raah e Rahmat Conference (26th & 27th of December 2026)** organized by **Subai Jamait Ahle Hadees Andhra Pradesh**, built with **HTML5**, **CSS3**, **Vanilla JavaScript**, and a **Google Apps Script (`Code.gs`)** backend connected to **Google Sheets** and **Google Drive**.

---

## 🌟 Key Updates & Features

### 1. Updated Form Structure (5 Streamlined Sections)
* **Section 1: Personal & Contact Details**
  * **Full Name (as per Government ID)** — Required
  * **Applicant Photo (Selfie or Passport-size Photo)** — Required. Strict client-side validation enforcing **JPG/PNG only** and **maximum 500 KB**. Displays an immediate live image preview thumbnail, converts to Base64 Data URL, and automatically uploads to a dedicated Google Drive folder (`Rah_e_Rahmat_Volunteer_Photos`).
  * **Gender** — Male / Female radio selector.
  * **Age** — Strictly validated between 18 and 65 years.
  * **Mobile Number (WhatsApp-enabled)** — 10-digit Indian mobile validation (`^[6-9]\d{9}$`).
  * **Alternate / Emergency Contact & Relationship** — Validated 10-digit mobile number distinct from WhatsApp.
  * **Email Address** — Optional.
* **Section 2: District & Local Coordination (1,000-Volunteer Allocation)**
  * **District Name (Andhra Pradesh)** — All 26 AP districts in alphabetical order. Quota configured with host-weighting: **500 volunteers for host district NTR** and **20 volunteers for each of the other 25 districts** (Total statewide force: **1,000 volunteers**).
  * **Mandal / Town / City** — Required.
  * **District President Name** — Renamed from District Coordinator — Required.
* **Section 3: Identification & Verification**
  * **Aadhaar Card Number** — 12-digit validation (`^\d{12}$`), live formatted with clean spacing (`XXXX XXXX XXXX`).
* **Section 4: Availability & Languages**
  * **Attendance Availability** — Both Days (Day 1 & Day 2) (Pre-selected single option).
  * **Preferred Shift / Time Slot** — Full Time (Pre-selected single option).
  * **Languages Spoken** — Telugu, Urdu, English, Hindi.
* **Section 5: Operational Note & Final Declaration**
  * **Mandatory Reporting Notice:** Prominent highlighted info box stating:
    > *"Important Reporting Notice: All selected volunteers must arrive on the morning of Friday, 25th December 2026 at the conference venue."*
  * **Declaration Checkbox:** Required pledge confirming accuracy and commitment to report on the morning of **Friday, 25th December 2026**.

> [!NOTE]
> **Removed Fields:** Arrival Date/Time, Mode of Travel, Departure Date/Time, Preferred Department/Team, Prior Experience, and T-Shirt/Badge Size have been completely removed from both the frontend form and backend Sheets schema.

---

### 2. Post-Submission Greeting & Downloadable Registration Form (with Photo)
* **Warm Greeting Message:** Displays a formal, welcoming salutation thanking the volunteer by name, displaying their unique Volunteer Reference ID (`RR-[DISTRICT_CODE]-[001..500]`), and reminding them of the reporting date (**Friday, 25th December 2026 – Morning**).
* **Official A4-Style Registration Slip:**
  * Official Conference Header: *Subai Jamait Ahle Hadees Andhra Pradesh &bull; 2-Day Grand Raah e Rahmat Conference (26th & 27th December 2026)* featuring `logo.png`.
  * **Applicant Photo:** Embedded directly from the client-side Base64 preview (guaranteed to render immediately without broken links).
  * Complete volunteer profile: Reference ID, Full Name, Gender, Age, WhatsApp, Emergency Contact, District, Mandal, District President Name, Masked Aadhaar (`XXXX-XXXX-1234`), Availability, Preferred Shift(s), Languages Spoken.
  * Prominent **Reporting Schedule** callout ribbon.
  * Full-width **Volunteer Accreditation Instructions** callout ribbon.
* **Action Buttons:**
  * **Download Registration Form (PDF):** One-click high-resolution PDF download using `html2pdf.js`.
  * **Print Form:** Direct browser print-to-PDF (`window.print()`) styled via dedicated `@media print` CSS.
  * **Register Another Volunteer:** Resets the portal and refreshes district quota counts.

---

### 3. Backend Engine (`Code.gs`)
* **Quota Allocation:** 1,000 total statewide volunteers: Host District NTR = **500 volunteers**; remaining 25 AP districts = **20 volunteers each** ($25 \times 20 = 500$). Total force = **1,000 volunteers**.
* **Photo Storage on Google Drive:** In `doPost(e)`, the Base64 photo string is decoded and saved into a dedicated Google Drive folder named **`Rah_e_Rahmat_Volunteer_Photos`** as `[VolunteerID]_[FullName].jpg`. The viewable Drive URL is saved in Column 4 of the `Registrations` sheet.
* **Registrations Sheet (20 Columns):**
  `Timestamp`, `Volunteer ID`, `Full Name`, `Photo Link (Drive)`, `Gender`, `Age`, `WhatsApp Number`, `Emergency Contact`, `Relationship`, `Email Address`, `District`, `District Code`, `Mandal / Town`, `District President Name`, `Aadhaar Number`, `Availability`, `Preferred Shift`, `Languages Spoken`, `Reporting Commitment`, `Registration Status`.
* **District Summary Tab:** Auto-updates with dynamic formula `=COUNTIF(Registrations!K:K, B2)` referencing the District Name column, Target Quotas (500 for NTR, 20 for others), live status, and row 28 summary total summing to 1,000 (`=SUM(D2:D27)`).
* **Concurrency Lock:** `LockService.getScriptLock()` prevents race conditions during simultaneous submissions.
* **Deduplication:** Prevents duplicate Aadhaar or WhatsApp entries.

---

## 📁 Repository Structure

```
CONFERENCE_FORMS/
├── index.html     # Semantic HTML5 5-step registration portal & slip view
├── styles.css     # CSS3 styles (Emerald & Gold theme, photo uploader, print styles)
├── app.js         # Vanilla JS (photo validation, 1,000-force quotas, PDF download)
├── Code.gs        # Google Apps Script backend (Drive photo storage & Sheets integration)
└── README.md      # Deployment instructions & documentation
```

---

## 🚀 Step-by-Step Google Sheets & Apps Script Setup

### Step 1: Open Your Google Sheet
1. Open your Google Sheet (**`Rah e Rahmat Conference - Volunteer Registrations`**).
2. Go to **Extensions** &rarr; **Apps Script**.

### Step 2: Paste the Updated `Code.gs`
1. Open the updated [Code.gs](file:///c:/Users/itsme/Desktop/CONFERENCE_FORMS/Code.gs) file.
2. Select all code, copy it, and replace the contents in the Apps Script editor.
3. Save the project (`Ctrl + S`).

### Step 3: Run `setupSheets` (Initializes Sheets & Headers)
1. In the toolbar, select **`setupSheets`** from the function dropdown.
2. Click **Run**.
3. If prompted for permissions, click **Review permissions** &rarr; select your Google account &rarr; **Advanced** &rarr; **Go to Rah e Rahmat Backend (unsafe)** &rarr; **Allow**.
4. Check your Google Sheet:
   * **`Registrations`** tab is updated with the 20 columns (including **Photo Link**).
   * **`District_Summary`** tab reflects the **1,000-volunteer allocation** (500 for host district NTR, 20 each for other 25 districts, and Row 28 summing to 1,000).

### Step 4: Deploy / Update Web App
1. In the Apps Script editor, click **Deploy** (top right) &rarr; **Manage deployments**.
2. Click the **Pencil icon** (Edit) on your active deployment.
3. Change **Version** to **`New version`**.
4. Ensure:
   * **Execute as:** **`Me (your_email@gmail.com)`**
   * **Who has access:** **`Anyone`**
5. Click **Deploy**.
6. Copy the **Web App URL** (ends in `/exec`).

### Step 5: Connect to the Frontend
1. Open [app.js](file:///c:/Users/itsme/Desktop/CONFERENCE_FORMS/app.js) in your code editor.
2. Locate the `SCRIPT_URL` constant near line 22:
   ```javascript
   const SCRIPT_URL = "YOUR_APPS_SCRIPT_EXEC_URL_HERE";
   ```
3. Replace `"YOUR_APPS_SCRIPT_EXEC_URL_HERE"` with your copied Web App URL (e.g., `https://script.google.com/macros/s/AKfycb.../exec`).
4. Save the file.
5. Open [index.html](file:///c:/Users/itsme/Desktop/CONFERENCE_FORMS/index.html) in your browser. The portal will automatically sync live district quota spots with your Google Sheet!

### Step 6: Maintenance & Photo Cleanup (Optional Utility)
If test rows or cancelled registrations are deleted from the `Registrations` sheet:
1. In the Apps Script toolbar, select **`cleanupOrphanedPhotos`** from the function dropdown.
2. Click **Run**.
3. The script scans `Rah_e_Rahmat_Volunteer_Photos` on Google Drive and moves any photo file whose ID is no longer referenced in the `Registrations` sheet to the Trash (`file.setTrashed(true)`), keeping storage tidy.

---

## 📋 Andhra Pradesh Districts Master Quota Table (1,000 Total Force)

| S.No | District Name | District Code | Target Quota | Reference ID Pattern |
|:---:|:---|:---:|:---:|:---:|
| 1 | Alluri Sitharama Raju | `ASR` | 20 | `RR-ASR-001` .. `RR-ASR-020` |
| 2 | Anakapalli | `ANK` | 20 | `RR-ANK-001` .. `RR-ANK-020` |
| 3 | Ananthapuramu | `ATP` | 20 | `RR-ATP-001` .. `RR-ATP-020` |
| 4 | Annamayya | `ANN` | 20 | `RR-ANN-001` .. `RR-ANN-020` |
| 5 | Bapatla | `BPT` | 20 | `RR-BPT-001` .. `RR-BPT-020` |
| 6 | Chittoor | `CTR` | 20 | `RR-CTR-001` .. `RR-CTR-020` |
| 7 | Dr. B.R. Ambedkar Konaseema | `KNS` | 20 | `RR-KNS-001` .. `RR-KNS-020` |
| 8 | East Godavari | `EGD` | 20 | `RR-EGD-001` .. `RR-EGD-020` |
| 9 | Eluru | `ELR` | 20 | `RR-ELR-001` .. `RR-ELR-020` |
| 10 | Guntur | `GNT` | 20 | `RR-GNT-001` .. `RR-GNT-020` |
| 11 | Kakinada | `KKD` | 20 | `RR-KKD-001` .. `RR-KKD-020` |
| 12 | Krishna | `KRI` | 20 | `RR-KRI-001` .. `RR-KRI-020` |
| 13 | Kurnool | `KRN` | 20 | `RR-KRN-001` .. `RR-KRN-020` |
| 14 | Nandyal | `NDL` | 20 | `RR-NDL-001` .. `RR-NDL-020` |
| 15 | **NTR (Host District)** | `NTR` | **500** | `RR-NTR-001` .. `RR-NTR-500` |
| 16 | Palnadu | `PLN` | 20 | `RR-PLN-001` .. `RR-PLN-020` |
| 17 | Parvathipuram Manyam | `PVM` | 20 | `RR-PVM-001` .. `RR-PVM-020` |
| 18 | Prakasam | `PKM` | 20 | `RR-PKM-001` .. `RR-PKM-020` |
| 19 | Sri Potti Sriramulu Nellore | `NLR` | 20 | `RR-NLR-001` .. `RR-NLR-020` |
| 20 | Sri Sathya Sai | `SSS` | 20 | `RR-SSS-001` .. `RR-SSS-020` |
| 21 | Srikakulam | `SKL` | 20 | `RR-SKL-001` .. `RR-SKL-020` |
| 22 | Tirupati | `TPT` | 20 | `RR-TPT-001` .. `RR-TPT-020` |
| 23 | Visakhapatnam | `VSP` | 20 | `RR-VSP-001` .. `RR-VSP-020` |
| 24 | Vizianagaram | `VZM` | 20 | `RR-VZM-001` .. `RR-VZM-020` |
| 25 | West Godavari | `WGD` | 20 | `RR-WGD-001` .. `RR-WGD-020` |
| 26 | YSR Kadapa | `YSR` | 20 | `RR-YSR-001` .. `RR-YSR-020` |
| **TOTAL** | **All 26 Districts (Statewide Force)** | — | **1,000** | **Statewide Total** |
