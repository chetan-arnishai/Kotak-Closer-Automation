
// 'use strict';

// const { chromium } = require('playwright');
// const config = require('./config.json');
// const { spawn } = require('child_process');
// const readline = require('readline');
// const fs = require('fs');
// const path = require('path');
// const os = require('os');

// const L = config.Login;
// const LOC = config.Locators;

// // ─── CLI Input Helper ─────────────────────────────────────────────────────────

// function askQuestion(query) {
//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//   });
//   return new Promise(resolve => {
//     rl.question(query, answer => {
//       rl.close();
//       resolve(answer.trim());
//     });
//   });
// }

// // ─── Utility ──────────────────────────────────────────────────────────────────

// async function safeAction(action, fieldName) {
//   console.log(`🔄 Trying [${fieldName}]...`);
//   try {
//     await action();
//     console.log(`✅ Done [${fieldName}]`);
//   } catch (err) {
//     console.log(`❌ Failed [${fieldName}]: ${err.message}`);
//   }
// }

// function normalize(value) {
//   return (value || '').trim().toLowerCase();
// }

// function formatGender(input) {
//   if (!input) return '';
//   const normalized = input.toString().trim().toLowerCase();
//   if (normalized === 'male') return 'Male';
//   if (normalized === 'female') return 'Female';
//   if (normalized === 'other') return 'Other';
//   return 'Invalid';
// }

// function formatDate(input) {
//   if (!input) return null;
//   let clean = input.toString().trim().replace(/[-/]+/g, '/').replace(/\s+/g, '');
//   let [day, month, year] = clean.split('/');
//   if (!day || !month || !year) return null;

//   const monthMap = {
//     jan: '01', january: '01',
//     feb: '02', february: '02',
//     mar: '03', march: '03',
//     apr: '04', april: '04',
//     may: '05',
//     jun: '06', june: '06',
//     jul: '07', july: '07',
//     aug: '08', august: '08',
//     sep: '09', september: '09',
//     oct: '10', october: '10',
//     nov: '11', november: '11',
//     dec: '12', december: '12',
//   };

//   if (isNaN(month)) {
//     month = monthMap[month.toLowerCase()];
//   } else {
//     month = month.padStart(2, '0');
//   }

//   day = day.padStart(2, '0');
//   if (year.length === 2) year = '20' + year;

//   return `${year}-${month}-${day}`;
// }

// function collectPDFs(folderName = 'upload_documents') {
//   const folder = path.join(os.homedir(), 'Desktop', folderName);
//   if (!fs.existsSync(folder)) {
//     console.warn(`⚠️ Folder not found: ${folder}`);
//     return [];
//   }
//   const pdfs = fs
//     .readdirSync(folder)
//     .filter(f => f.toLowerCase().endsWith('.pdf'))
//     .map(f => path.join(folder, f));
//   console.log(`📂 Found ${pdfs.length} PDF(s) in: ${folder}`);
//   return pdfs;
// }

// // ─── Clean reportvalues.json ──────────────────────────────────────────────────

// function cleanReportValues() {
//   console.log('\n🔄 Trying [Clean reportvalues.json]...');
//   try {
//     const reportPath = path.join(__dirname, 'inputs', 'reportvalues.json');
//     fs.writeFileSync(reportPath, JSON.stringify({}), 'utf-8');
//     console.log('✅ Done [Clean reportvalues.json]');
//   } catch (err) {
//     console.log(`❌ Failed [Clean reportvalues.json]: ${err.message}`);
//     throw err;
//   }
// }

// // ─── Python Runner ────────────────────────────────────────────────────────────

// function runPythonScript(pdfPath) {
//   return new Promise((resolve, reject) => {
//     console.log('\n🔄 Trying [Run Python Script - PDF → JSON]...');
//     console.log(`   → PDF Path: ${pdfPath}`);

//     const outputPath = path.join(__dirname, 'inputs', 'reportvalues.json');
//     const py = spawn('python', [
//       path.join(__dirname, 'test.py'),
//       pdfPath,
//       outputPath,
//     ]);

//     py.stdout.on('data', d => console.log(`   📤 PYTHON: ${d.toString().trim()}`));
//     py.stderr.on('data', d => console.error(`   ❌ PYTHON ERROR: ${d.toString().trim()}`));

//     py.on('close', code => {
//       if (code === 0) {
//         console.log('✅ Done [Run Python Script - PDF → JSON]');
//         resolve();
//       } else {
//         const msg = `Python script exited with code ${code}`;
//         console.log(`❌ Failed [Run Python Script]: ${msg}`);
//         reject(new Error(msg));
//       }
//     });

//     py.on('error', err => {
//       console.log(`❌ Failed [Run Python Script - spawn error]: ${err.message}`);
//       reject(err);
//     });
//   });
// }

// // ─── Upload Helpers ───────────────────────────────────────────────────────────

// async function uploadPDFsOneByOne(page, folderName = 'upload_documents') {
//   const pdfPaths = collectPDFs(folderName);

//   if (pdfPaths.length === 0) {
//     console.log('⚠️ No PDFs found — skipping upload');
//     return;
//   }

//   for (let i = 0; i < pdfPaths.length; i++) {
//     const filePath = pdfPaths[i];
//     const fileName = path.basename(filePath);

//     console.log(`\n🔄 Trying [Upload PDF ${i + 1}/${pdfPaths.length}: ${fileName}]...`);

//     await safeAction(async () => {
//       const inputsBefore = await page.locator(LOC.ConclusionSection.uploadInput).count();

//       await page.click(LOC.ConclusionSection.uploadAddLabel);
//       console.log(`   → Clicked ADD (row ${i + 1})`);

//       await page.waitForFunction(
//         countBefore => document.querySelectorAll('input[id="inputGroupFile04"]').length > countBefore,
//         inputsBefore,
//         { timeout: 5000 }
//       );

//       await page.waitForTimeout(400);

//       const targetInput = page.locator(LOC.ConclusionSection.uploadInput).nth(i);
//       await targetInput.setInputFiles(filePath);
//       await page.waitForTimeout(800);

//       console.log(`   → Uploaded to row ${i + 1}: ${fileName}`);
//     }, `Upload PDF row ${i + 1}`);
//   }

//   console.log(`\n🎉 All ${pdfPaths.length} PDF(s) uploaded`);
// }

// async function uploadInvoicePDF(page) {
//   console.log('\n🔄 Trying [Upload Invoice PDF]...');
//   const filePath = path.join(os.homedir(), 'Desktop', 'upload_documents', 'invoice.pdf');

//   if (!fs.existsSync(filePath)) {
//     console.log(`❌ Failed [Upload Invoice PDF]: File not found at ${filePath}`);
//     return;
//   }

//   await safeAction(async () => {
//     await page.locator(LOC.ConclusionSection.invoiceAddLabel).click();
//     console.log('   → Clicked correct ADD (Invoice section)');

//     const fileInput = page.locator(LOC.ConclusionSection.uploadInput).last();
//     await fileInput.waitFor({ state: 'visible' });

//     await fileInput.setInputFiles(filePath);
//     console.log('   → Invoice file set');
//   }, 'Upload Invoice PDF');
// }

// // ─── Fill Form ────────────────────────────────────────────────────────────────

// async function fillForm(page) {
//   // Re-read report fresh after python populated it
//   const report = JSON.parse(fs.readFileSync(path.join(__dirname, 'inputs', 'reportvalues.json'), 'utf-8'));
//   console.log('\n📋 Starting fillForm...');

//   // ── Hospital Section ───────────────────────────────────────────────────────

//   await safeAction(async () => {
//     await page.waitForTimeout(1000);
//     await page.click(LOC.HospitalSection.sectionButton);
//   }, 'Open Hospital Verification Section');

//   await safeAction(async () => {
//     await page.waitForTimeout(1000);
//     await page.selectOption(LOC.HospitalSection.visitToHospital, 'yes');
//   }, 'Visit To Hospital');

//   await safeAction(async () => {
//     await page.waitForTimeout(1000);
//     await page.fill(LOC.HospitalSection.hospitalRegistrationNumber, report?.['registration no']);
//   }, 'Hospital Registration Number');

//   await safeAction(async () => {
//     await page.waitForTimeout(1000);
//     const isOT =
//       normalize(report?.['ot register copy']) === 'no' ||
//       normalize(report?.['ot register copy']) === 'not provided' ||
//       normalize(report?.['ot register copy']) === 'na';
//     const dropdown = page.locator(LOC.HospitalSection.OT);
//     if (await dropdown.count() === 0) throw new Error('OT dropdown not found in DOM');
//     await dropdown.selectOption(isOT ? 'no' : 'yes');
//     console.log(`   → OT set to: ${isOT ? 'no' : 'yes'}`);
//   }, 'OT');

//   await safeAction(async () => {
//     await page.selectOption(LOC.HospitalSection.relativeNearHospital, 'no');
//   }, 'Relative Near Hospital');

//   await safeAction(async () => {
//     await page.fill(LOC.HospitalSection.comments, 'NA');
//   }, 'Comments');

//   await safeAction(async () => {
//     const ipd = normalize(report?.['ipd register entry']);
//     const isNotProvided = ipd === 'not provided' || ipd === 'tertiary care hospital- not provided' || ipd === 'no';
//     const dropdown = page.locator(LOC.HospitalSection.IPRegisterEntry);
//     if (await dropdown.count() === 0) throw new Error('IPD dropdown not found in DOM');
//     await dropdown.selectOption(isNotProvided ? 'no' : 'yes');

//     if (isNotProvided) {
//       const reason = page.locator(LOC.HospitalSection.IPRegisterEntryReason);
//       if (await reason.count() > 0) await reason.fill(report?.['ipd register entry']);
//       console.log('   → IPD Not Provided → NO');
//     } else {
//       await page.locator(LOC.HospitalSection.IPRegisterEntryYes).check();
//       console.log('   → IPD Verified → YES');
//     }
//   }, 'IPD Register Entry');

//   await safeAction(async () => {
//     await page.waitForTimeout(1000);
//     await page.selectOption(LOC.HospitalSection.ICPsCollected, 'yes');
//   }, 'ICPs Collected');

//   await safeAction(async () => {
//     await page.locator(LOC.HospitalSection.ICPsNumber).fill('00');
//   }, 'ICPs Number');

//   await safeAction(async () => {
//     await page.locator(LOC.HospitalSection.ICPsCollectedFindings).fill(report?.['indoor case paper observation']);
//   }, 'ICPs Collected Findings');

//   await safeAction(async () => {
//     await page.waitForTimeout(1000);
//     await page.selectOption(LOC.HospitalSection.AnyOtherDispensaryNoted, 'no');
//   }, 'Any Other Dispensary Noted');

//   await safeAction(async () => {
//     const billBookCollected = normalize(report?.['carbon copy of the bill']);
//     const isNotProvided =
//       billBookCollected === 'not provided' ||
//       billBookCollected === 'tertiary care hospital- not provided' ||
//       billBookCollected === 'no';
//     const dropdown = page.locator(LOC.HospitalSection.billBookCollected);
//     if (await dropdown.count() === 0) throw new Error('Bill Book dropdown not found in DOM');
//     await dropdown.selectOption(isNotProvided ? 'no' : 'yes');

//     if (isNotProvided) {
//       await page.locator(LOC.HospitalSection.billBookCollectedReason).fill(report?.['carbon copy of the bill']);
//       console.log('   → Bill Book → NO');
//     } else {
//       await page.locator(LOC.HospitalSection.billBookCollectedObservations).fill(report?.['carbon copy of the bill']);
//       console.log('   → Bill Book → YES');
//     }
//   }, 'Bill Book Collected');

//   await safeAction(async () => {
//     const tariff = normalize(report?.['tariff list']);
//     const isNotProvided =
//       tariff === 'tertiary care hospital- not provided' ||
//       tariff === 'not provided' ||
//       tariff === 'no';
//     await page.locator(LOC.HospitalSection.tariffDetailsCardCollected).selectOption(isNotProvided ? 'no' : 'yes');

//     if (isNotProvided) {
//       await page.locator(LOC.HospitalSection.tariffDetailsCardCollectedReason).fill(report?.['tariff list'] || 'NA');
//       console.log('   → Tariff → NO');
//     } else {
//       await page.locator(LOC.HospitalSection.tariffDetailsCardObservations).fill(report?.['tariff list'] || 'NA');
//       console.log('   → Tariff → YES');
//     }
//   }, 'Tariff List');

//   await safeAction(async () => {
//     await page.waitForTimeout(1000);
//     await page.selectOption(LOC.HospitalSection.hospitalAuthorityStatement, 'yes');
//   }, 'Hospital Authority Statement');

//   await safeAction(async () => {
//     await page.locator(LOC.HospitalSection.hospitalAuthorityStatementObservations).fill(report?.['hospital visit findings.']);
//   }, 'Hospital Authority Statement Observations');

//   await safeAction(async () => {
//     await page.waitForTimeout(1000);
//     await page.selectOption(LOC.HospitalSection.hospitalAuthorityPED, 'no');
//   }, 'Hospital Authority PED');

//   await safeAction(async () => {
//     const isSurgical = normalize(report?.['line of treatment']) === 'surgical';
//     if (isSurgical) {
//       await page.locator(LOC.HospitalSection.managementCaseSurgical).check();
//       console.log('   → Surgical Management selected');
//     } else {
//       await page.locator(LOC.HospitalSection.managementCaseMedical).check();
//       const obs = page.locator(LOC.HospitalSection.medicalManagementActiveLineOfTreatment);
//       if (await obs.count() > 0) await obs.fill(report?.['line of treatment'] || 'NA');
//       console.log('   → Medical Management selected');
//     }
//   }, 'Management Case');

//   await safeAction(async () => {
//     await page.locator(LOC.HospitalSection.noMlcApplicable).check();
//   }, 'MLC Details (Not Applicable)');

//   // ── Treating Doctor ────────────────────────────────────────────────────────

//   await safeAction(async () => {
//     await page.locator(LOC.HospitalSection.nameOfDoctor).fill(report?.['treating doctor name']);
//   }, 'Doctor Name');

//   await safeAction(async () => {
//     await page.locator(LOC.HospitalSection.doctorQualification).fill(report?.['qualification']);
//   }, 'Doctor Qualification');

//   await safeAction(async () => {
//     await page.locator(LOC.HospitalSection.registrationNumber).fill(report?.['registration number']);
//   }, 'Doctor Registration Number');

//   await safeAction(async () => {
//     const metDoctor = normalize(report?.['details of statement issued by treating doctor visit findings']);
//     const isNo =
//       metDoctor === 'no' ||
//       metDoctor === '' ||
//       metDoctor === 'not provided' ||
//       metDoctor === 'hospital non cooperative' ||
//       metDoctor === 'na';

//     await page.selectOption(LOC.HospitalSection.treatingDoctorStatementCollected, isNo ? 'no' : 'yes');

//     // Fill reason textarea for BOTH yes and no cases
//     await page.locator(LOC.HospitalSection.treatingDoctorStatementCollectedReason).fill(
//       report?.['details of statement issued by treating doctor visit findings'] || ''
//     );

//     console.log(`   → Met Doctor → ${isNo ? 'NO' : 'YES'}`);
//   }, 'Treating Doctor Statement Collected');

//   await safeAction(async () => {
//     const discrepancy = (report?.['any discrepancy / background'] || '').trim();
//     const hasDiscrepancy = discrepancy && normalize(discrepancy) !== 'no';
//     if (hasDiscrepancy) {
//       await page.selectOption(LOC.HospitalSection.preExistingDiseaseAnyDiscrepancy, 'yes');
//       await page.locator(LOC.HospitalSection.preExistingDiseaseAnyDiscrepancyYes).fill(report?.['any discrepancy / background']);
//       console.log('   → Discrepancy → YES');
//     } else {
//       await page.selectOption(LOC.HospitalSection.preExistingDiseaseAnyDiscrepancy, 'no');
//       console.log('   → Discrepancy → NO');
//     }
//   }, 'Discrepancy');

//   // ── Lab Section ────────────────────────────────────────────────────────────

//   await safeAction(async () => {
//     await page.selectOption(LOC.LabSection.billBookVisitDone, 'yes');
//   }, 'Bill Book Visit Done');

//   await safeAction(async () => {
//     await page.locator(LOC.LabSection.billBookFindings).fill(report?.['pathology manual register & visit findings']);
//   }, 'Bill Book Findings');

//   await safeAction(async () => {
//     await page.locator(LOC.LabSection.labName).fill(report?.['pathology center name']);
//   }, 'Lab Name');

//   await safeAction(async () => {
//     await page.locator(LOC.LabSection.labLocation).fill(report?.['address._2']);
//   }, 'Lab Location');

//   await safeAction(async () => {
//     const isInHouse = normalize(report?.['pathology center name']) === 'in house';
//     await page.selectOption(LOC.LabSection.inHouse, isInHouse ? 'yes' : 'no');
//     if (!isInHouse) {
//       await page.locator(LOC.LabSection.inHouseNoDistance).fill(report?.['pathology center name']);
//     }
//     console.log(`   → Lab In House → ${isInHouse ? 'YES' : 'NO'}`);
//   }, 'Lab In House');

//   await safeAction(async () => {
//     await page.selectOption(LOC.LabSection.labRegisterEntryVerified, 'yes');
//   }, 'Lab Register Entry Verified');

//   await safeAction(async () => {
//     await page.locator(LOC.LabSection.labRegisterEntryVerifiedYes).check();
//   }, 'Lab Register Entry - Matching with Claim Document');

//   await safeAction(async () => {
//     await page.selectOption(LOC.LabSection.billBook, 'yes');
//   }, 'Lab Bill Book');

//   await safeAction(async () => {
//     await page.locator(LOC.LabSection.billBookYes).check();
//   }, 'Lab Bill Book - Matching with Claim Document');

//   await safeAction(async () => {
//     await page.selectOption(LOC.LabSection.reportsValidation, 'yes');
//   }, 'Reports Validation');

//   await safeAction(async () => {
//     await page.locator(LOC.LabSection.nameOfEmpanelledPathologist).fill(report?.['pathologist doctor name']);
//   }, 'Name Of Empanelled Pathologist');

//   await safeAction(async () => {
//     await page.locator(LOC.LabSection.billBookRegNo).fill(report?.['registration no_2']);
//   }, 'Bill Book Reg No');

//   await safeAction(async () => {
//     await page.selectOption(LOC.LabSection.pastRecordsChecked, 'yes');
//   }, 'Past Records Checked');

//   await safeAction(async () => {
//     await page.locator(LOC.LabSection.labVerificationSummary).fill(
//       report?.['details of statement issued by pathologist doctor visit findings'] || 'Not Provided'
//     );
//   }, 'Lab Verification Summary');

//   await safeAction(async () => {
//     await page.selectOption(LOC.LabSection.labOption, 'Pathology Lab');
//   }, 'Lab Option');

//   // ── Chemist Section ────────────────────────────────────────────────────────

//   await safeAction(async () => {
//     await page.selectOption(LOC.ChemistSection.chemistVerificationVisitDone, 'yes');
//   }, 'Chemist Verification Visit Done');

//   await safeAction(async () => {
//     await page.locator(LOC.ChemistSection.pharmacyName).fill(report?.['pharmacy name']);
//   }, 'Pharmacy Name');

//   await safeAction(async () => {
//     const isInHouse = normalize(report?.['pharmacy name']) === 'in house';
//     await page.selectOption(LOC.ChemistSection.pharmacyInHouse, isInHouse ? 'yes' : 'no');
//     console.log(`   → Pharmacy In House → ${isInHouse ? 'YES' : 'NO'}`);
//   }, 'Pharmacy In-House');

//   await safeAction(async () => {
//     await page.selectOption(LOC.ChemistSection.pharmacyBillBook, 'yes');
//   }, 'Pharmacy Bill Book');

//   await safeAction(async () => {
//     await page.locator(LOC.ChemistSection.pharmacyBillBookYes).check();
//   }, 'Pharmacy Bill Book - Matching with Claim Documents');

//   await safeAction(async () => {
//     const raw = report?.['bill verification findings'];
//     const value = normalize(raw);
//     const isNo = value === 'na' || value === 'no';

//     await page.selectOption(LOC.ChemistSection.pharmacyBillRecords, isNo ? 'others' : 'carbon copies');

//     if (isNo) {
//       await page.fill(LOC.ChemistSection.pharmacyBillRecordsFindings, 'NO');
//       console.log('   → Bill Verification → NO');
//     } else {
//       await page.fill(LOC.ChemistSection.pharmacyBillRecordsFindings, report?.['bill verification findings'] || 'NA');
//       console.log('   → Bill Verification → Carbon Copies');
//     }
//   }, 'Bill Verification');

//   await safeAction(async () => {
//     await page.selectOption(LOC.ChemistSection.purchaseInvoiceCollected, 'yes');
//   }, 'Purchase Invoice Collected');

//   await safeAction(async () => {
//     await page.selectOption(LOC.ChemistSection.purchaseInvoiceCollectedYesVerified, 'no');
//   }, 'Purchase Invoice Verified');

//   await safeAction(async () => {
//     await page.selectOption(LOC.ChemistSection.pharmacyPastRecordsChecked, 'yes');
//   }, 'Pharmacy Past Records Checked');

//   await safeAction(async () => {
//     await page.selectOption(LOC.ChemistSection.chemistStatementCollected, 'no');
//   }, 'Chemist Statement Collected');

//   await safeAction(async () => {
//     await page.locator(LOC.ChemistSection.chemistStatementCollectedReason).fill('Not Provided');
//   }, 'Chemist Statement Collected Reason');

//   await safeAction(async () => {
//     await page.locator(LOC.ChemistSection.overAllChemistVerificationSummary).fill('Not Provided');
//   }, 'Overall Chemist Verification Summary');

//   await safeAction(async () => {
//     await page.locator(LOC.ChemistSection.labOptionPastRecords).fill(report?.['past history'] || 'Not Provided');
//   }, 'Past Record Details');

//   await safeAction(async () => {
//     await page.locator(LOC.ChemistSection.labOptionOtherObservationFindings).fill(report?.['pharmacy visit findings']);
//   }, 'Any Other Observation/Findings');

//   await safeAction(async () => {
//     await page.selectOption(LOC.ChemistSection.labOptionPEDFindings, 'No');
//   }, 'PED Findings');

//   await safeAction(async () => {
//     await page.locator(LOC.ChemistSection.overAllHospitalVerificationFindings).fill(report?.['overall findings and details']);
//   }, 'Overall Hospital Verification Findings');
  
//   await page.waitForTimeout(1000);

//   // ── Home Visit Section ─────────────────────────────────────────────────────

//   await safeAction(async () => {
//     await page.locator(LOC.HomeVisitSection.sectionButton).click();
//   }, 'Open Home Visit Section');

//   await safeAction(async () => {
//     await page.selectOption(LOC.HomeVisitSection.visitDone, 'Yes');
//   }, 'Home Visit Done');

//   await safeAction(async () => {
//     await page.selectOption(LOC.HomeVisitSection.appointmentTaken, 'Yes');
//   }, 'Appointment Taken');

//   await safeAction(async () => {
//     await page.locator(LOC.HomeVisitSection.nameOfInsuredWithWhomAppointmentWasTaken).fill(report?.['patient name']);
//   }, 'Name Of Insured With Whom Appointment Was Taken');

//   await safeAction(async () => {
//     await page.locator(LOC.HomeVisitSection.mobileNo).fill(report?.['residence contact no']);
//   }, 'Mobile Number');

//   await safeAction(async () => {
//     await page.locator(LOC.HomeVisitSection.memberAddress).fill(report?.['residence address']);
//   }, 'Member Address');

//   await safeAction(async () => {
//     await page.locator(LOC.HomeVisitSection.nameOfPatient).fill(report?.['patient name']);
//   }, 'Patient Name');

//   await safeAction(async () => {
//     const dob = formatDate(report?.['patient dob']);
//     if (!dob) throw new Error('Invalid or missing date of birth in report');
//     await page.locator(LOC.HomeVisitSection.dateOfBirthOfPatient).fill(dob);
//   }, 'Date Of Birth');

//   await safeAction(async () => {
//     const value = formatGender(report?.['gender']);
//     if (!value || value === 'Invalid') throw new Error(`Invalid gender value: ${report?.['gender']}`);
//     await page.selectOption(LOC.HomeVisitSection.gender, value);
//   }, 'Gender');

//   await safeAction(async () => {
//     await page.selectOption(LOC.HomeVisitSection.statementCollected, 'Yes');
//   }, 'Statement Collected');

//   await safeAction(async () => {
//     await page.locator(LOC.HomeVisitSection.statementCollectedFinding).fill(report?.['remarks']);
//   }, 'Statement Collected Finding');

//   await safeAction(async () => {
//     await page.selectOption(LOC.HomeVisitSection.anyDiscrepancies, 'No');
//   }, 'Any Discrepancies');

//   await safeAction(async () => {
//     await page.selectOption(LOC.HomeVisitSection.anyPEDNonDisclosureFindings, 'No');
//   }, 'Any PED Non-Disclosure Findings');

//   await safeAction(async () => {
//     await page.selectOption(LOC.HomeVisitSection.pastDocumentsCollected, 'No');
//     await page.locator(LOC.HomeVisitSection.pastDocumentsCollectedReason).fill('not provided');
//   }, 'Past Documents Collected');

//   await safeAction(async () => {
//     await page.selectOption(LOC.HomeVisitSection.KYCDocumentsCollected, 'Yes');
//     await page.locator(LOC.HomeVisitSection.KYCDocumentsCollectedYes).check();
//   }, 'KYC Documents Collected');


//   // ── Others Section ─────────────────────────────────────────────────────────

//   await safeAction(async () => {
//     await page.locator(LOC.OthersSection.notVVApplicable).check();
//   }, 'Not VV Applicable');

//   await safeAction(async () => {
//     await page.locator(LOC.OthersSection.notVFPApplicable).check();
//   }, 'Not VFP Applicable');

//   await safeAction(async () => {
//     await page.locator(LOC.OthersSection.notICFCApplicable).check();
//   }, 'Not ICFC Applicable');

//   await safeAction(async () => {
//     await page.locator(LOC.OthersSection.addDocumentLabel).click();
//   }, 'Click ADD (Document)');

//   await safeAction(async () => {
//     await page.locator(LOC.OthersSection.docMember).setInputFiles(
//       path.join(os.homedir(), 'Desktop', 'upload_documents', 'Insured Part.pdf')
//     );
//   }, 'Upload Insured Part Document');

//   await page.waitForTimeout(2000);

//   // ── Office/School/College Visit Section ────────────────────────────────────

//   await safeAction(async () => {
//     await page.getByRole('button', { name: LOC.OfficeVisitSection.sectionButtonName }).click();
//   }, 'Open Office/School/College Visit Section');

//   await safeAction(async () => {
//     await page.selectOption(LOC.OfficeVisitSection.officeVisit, 'No');
//   }, 'Office Visit');

//   await safeAction(async () => {
//     await page.locator(LOC.OfficeVisitSection.officeVisitNotDoneReason).fill('NA');
//   }, 'Office Visit Not Done Reason');

//   console.log('\n✅ fillForm completed');
// }

// // ─── Conclusion ───────────────────────────────────────────────────────────────

// async function conclusion(page) {
//   const report = JSON.parse(fs.readFileSync(path.join(__dirname, 'inputs', 'reportvalues.json'), 'utf-8'));
//   console.log('\n📋 Starting conclusion...');

//   await safeAction(async () => {
//     await page.locator(LOC.ConclusionSection.sectionButton).click();
//   }, 'Open Verification Conclusion Section');

//   await safeAction(async () => {
//     await page.locator(LOC.ConclusionSection.finalObservationSuggestion).fill(report?.['conclusion / recommendation']);
//   }, 'Final Observation');

//   await uploadPDFsOneByOne(page, 'upload_documents');

//   await uploadInvoicePDF(page);

//   await safeAction(async () => {
//     await page.locator(LOC.ConclusionSection.expenditureRemark).fill('NA');
//   }, 'Expenditure Remark');

//   await safeAction(async () => {
//     await page.locator(LOC.ConclusionSection.expenditureAmount).fill('00');
//   }, 'Expenditure Amount');

//   console.log('\n✅ Conclusion completed');
// }

// // ─── Find Claim ───────────────────────────────────────────────────────────────

// async function findClaim(page, claimNumber) {
//   console.log(`\n🔍 Finding claim: ${claimNumber}`);
//   try {
//     console.log('🔄 Trying [Open Claim Section]...');
//     await page.waitForTimeout(1000);
//     await page.click('#root > div > div.App > div > div.sidebar.sidebar-fixed > ul > div > div.simplebar-wrapper > div.simplebar-mask > div > div > div > li:nth-child(2) > a');
//     console.log('✅ Done [Open Claim Section]');

//     console.log('🔄 Trying [Wait for search input]...');
//     await page.waitForTimeout(1000);
//     await page.waitForSelector(LOC.ClaimSearch.searchInput, { timeout: 10000 });
//     console.log('✅ Done [Wait for search input]');

//     console.log('🔄 Trying [Fill Claim Number]...');
//     await page.fill(LOC.ClaimSearch.searchInput, claimNumber);
//     console.log(`✅ Done [Fill Claim Number]: ${claimNumber}`);

//     await page.waitForTimeout(1000);

//     await Promise.race([
//       page.locator(LOC.ClaimSearch.noRecordsText).waitFor(),
//       page.locator(LOC.ClaimSearch.firstResultLink).first().waitFor(),
//     ]);

//     const noRecord = await page.locator(LOC.ClaimSearch.noRecordsText).count();
//     if (noRecord > 0) {
//       console.log(`❌ Failed [Find Claim]: No records found for claim number ${claimNumber}`);
//       return false;
//     }

//     await page.waitForTimeout(1000);
//     // Use .first() to avoid strict mode violation when multiple <a> exist in the same row
//     await page.locator(LOC.ClaimSearch.firstResultLink).first().click();
//     await page.waitForTimeout(1000);
//     console.log('✅ Done [Open Claim]: Claim opened successfully');
//     return true;
//   } catch (err) {
//     console.error(`❌ Failed [Find Claim]: ${err.message}`);
//     return false;
//   }
// }

// // ─── Login ────────────────────────────────────────────────────────────────────

// async function login(page) {
//   console.log('\n🔄 Trying [Login]...');
//   try {
//     await page.goto(LOC.Login.url, { waitUntil: 'load' });
//     await page.waitForSelector(L.username_path);
//     await page.waitForSelector(L.password_path);
//     await page.fill(L.username_path, L.USERNAME);
//     await page.fill(L.password_path, L.PASSWORD);
//     await page.waitForTimeout(4000);
//     await page.click(L.LOGIN_BTN);
//     await page.waitForLoadState('networkidle');
//     console.log('✅ Done [Login]');
//   } catch (err) {
//     console.log(`❌ Failed [Login]: ${err.message}`);
//     throw err;
//   }
// }

// // ─── Entry Point ──────────────────────────────────────────────────────────────

// (async () => {
//   console.log('===========================================');
//   console.log('       CLAIM AUTOMATION SCRIPT');
//   console.log('===========================================\n');

//   // Step 1: Get inputs from user
//   const pdfPath = await askQuestion('📄 Enter PDF path: ');
//   if (!pdfPath || !fs.existsSync(pdfPath)) {
//     console.log(`❌ PDF file not found at path: "${pdfPath}". Exiting.`);
//     process.exit(1);
//   }

//   const claimNumber = await askQuestion('🔢 Enter Claim Number: ');
//   if (!claimNumber) {
//     console.log('❌ Claim number cannot be empty. Exiting.');
//     process.exit(1);
//   }

//   console.log(`\n✅ PDF Path: ${pdfPath}`);
//   console.log(`✅ Claim Number: ${claimNumber}`);

//   // Step 2: Clean reportvalues.json
//   try {
//     cleanReportValues();
//   } catch (err) {
//     console.error('❌ Could not clean reportvalues.json. Exiting.');
//     process.exit(1);
//   }

//   // Step 3: Run Python script
//   try {
//     await runPythonScript(pdfPath);
//   } catch (err) {
//     console.error('❌ Python script failed. Exiting.');
//     process.exit(1);
//   }

//   // Step 4: Launch browser and login
//   console.log('\n🔄 Trying [Launch Browser]...');
//   let browser, page;
//   try {
//     browser = await chromium.launch({ headless: false });
//     const context = await browser.newContext();
//     page = await context.newPage();
//     console.log('✅ Done [Launch Browser]');
//   } catch (err) {
//     console.log(`❌ Failed [Launch Browser]: ${err.message}`);
//     process.exit(1);
//   }

//   try {
//     await login(page);
//   } catch (err) {
//     console.error('❌ Login failed. Exiting.');
//     await browser.close();
//     process.exit(1);
//   }

//   // Step 5: Find claim
//   const claimFound = await findClaim(page, claimNumber);
//   if (!claimFound) {
//     console.log('❌ Claim not found or could not be opened. Exiting.');
//     await browser.close();
//     process.exit(1);
//   }

//   // Step 6: Fill form
//   await fillForm(page);

//   // Step 7: Ask user if they want to call conclusion
//   console.log('\n===========================================');
//   const answer = await askQuestion('❓ Do you want to call conclusion? (yes/no): ');

//   if (normalize(answer) === 'yes' || normalize(answer) === 'y') {
//     console.log('✅ Proceeding to conclusion...\n');
//     await conclusion(page);
//     console.log('\n🎉 All done! Script completed successfully.');
//   } else {
//     console.log('⏸️  Conclusion skipped. Browser will remain open. Close it manually when done.');
//   }

// })();

/**
 * ==============================================
 * ==========================================
 */

'use strict';

const { app, BrowserWindow, ipcMain } = require('electron');
const { chromium } = require('playwright');
const config = require('./config.json');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const L = config.Login;
const LOC = config.Locators;

let mainWindow = null;
let playwrightPage = null;

// ─── Electron Window ──────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 820,
    height: 750,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// ─── Log Helper ───────────────────────────────────────────────────────────────

function log(msg) {
  console.log(msg);
  if (mainWindow) mainWindow.webContents.send('log', msg);
}

// ─── Utility ──────────────────────────────────────────────────────────────────

async function safeAction(action, fieldName) {
  log(`🔄 Trying [${fieldName}]...`);
  try {
    await action();
    log(`✅ Done [${fieldName}]`);
  } catch (err) {
    log(`❌ Failed [${fieldName}]: ${err.message}`);
  }
}

function normalize(value) {
  return (value || '').trim().toLowerCase();
}

function formatGender(input) {
  if (!input) return '';
  const normalized = input.toString().trim().toLowerCase();
  if (normalized === 'male') return 'Male';
  if (normalized === 'female') return 'Female';
  if (normalized === 'other') return 'Other';
  return 'Invalid';
}

function formatDate(input) {
  if (!input) return null;
  let clean = input.toString().trim().replace(/[-/]+/g, '/').replace(/\s+/g, '');
  let [day, month, year] = clean.split('/');
  if (!day || !month || !year) return null;

  const monthMap = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', september: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12',
  };

  if (isNaN(month)) {
    month = monthMap[month.toLowerCase()];
  } else {
    month = month.padStart(2, '0');
  }

  day = day.padStart(2, '0');
  if (year.length === 2) year = '20' + year;

  return `${year}-${month}-${day}`;
}

function collectPDFs(folderName = 'upload_documents') {
  const folder = path.join(os.homedir(), 'Desktop', folderName);
  if (!fs.existsSync(folder)) {
    log(`⚠️ Folder not found: ${folder}`);
    return [];
  }
  const pdfs = fs
    .readdirSync(folder)
    .filter(f => f.toLowerCase().endsWith('.pdf'))
    .map(f => path.join(folder, f));
  log(`📂 Found ${pdfs.length} PDF(s) in: ${folder}`);
  pdfs.forEach((p, i) => log(`   ${i + 1}. ${path.basename(p)}`));
  return pdfs;
}

// ─── Clean reportvalues.json ──────────────────────────────────────────────────

function cleanReportValues() {
  log('\n🔄 Trying [Clean reportvalues.json]...');
  try {
    const reportPath = path.join(__dirname, 'inputs', 'reportvalues.json');
    fs.writeFileSync(reportPath, JSON.stringify({}), 'utf-8');
    log('✅ Done [Clean reportvalues.json]');
  } catch (err) {
    log(`❌ Failed [Clean reportvalues.json]: ${err.message}`);
    throw err;
  }
}

// ─── Python Runner ────────────────────────────────────────────────────────────

function runPythonScript(pdfPath) {
  return new Promise((resolve, reject) => {
    log('\n🔄 Trying [Run Python Script - PDF → JSON]...');
    log(`   → PDF Path: ${pdfPath}`);

    const outputPath = path.join(__dirname, 'inputs', 'reportvalues.json');
    const py = spawn('python', [
      path.join(__dirname, 'test.py'),
      pdfPath,
      outputPath,
    ]);

    py.stdout.on('data', d => log(`   📤 PYTHON: ${d.toString().trim()}`));
    py.stderr.on('data', d => log(`   ❌ PYTHON ERROR: ${d.toString().trim()}`));

    py.on('close', code => {
      if (code === 0) {
        log('✅ Done [Run Python Script - PDF → JSON]');
        resolve();
      } else {
        const msg = `Python script exited with code ${code}`;
        log(`❌ Failed [Run Python Script]: ${msg}`);
        reject(new Error(msg));
      }
    });

    py.on('error', err => {
      log(`❌ Failed [Run Python Script - spawn error]: ${err.message}`);
      reject(err);
    });
  });
}

// ─── Upload Helpers ───────────────────────────────────────────────────────────

// async function uploadPDFsOneByOne(page, folderName = 'upload_documents') {
//   const pdfPaths = collectPDFs(folderName);

//   if (pdfPaths.length === 0) {
//     log('⚠️ No PDFs found — skipping upload');
//     return;
//   }

//   for (let i = 0; i < pdfPaths.length; i++) {
//     const filePath = pdfPaths[i];
//     const fileName = path.basename(filePath);

//     log(`\n🔄 Trying [Upload PDF ${i + 1}/${pdfPaths.length}: ${fileName}]...`);

//     await safeAction(async () => {
//       const inputsBefore = await page.locator(LOC.ConclusionSection.uploadInput).count();

//       await page.click(LOC.ConclusionSection.uploadAddLabel);
//       log(`   → Clicked ADD (row ${i + 1})`);

//       await page.waitForFunction(
//         countBefore => document.querySelectorAll('input[id="inputGroupFile04"]').length > countBefore,
//         inputsBefore,
//         { timeout: 5000 }
//       );

//       await page.waitForTimeout(400);

//       const targetInput = page.locator(LOC.ConclusionSection.uploadInput).nth(i);
//       await targetInput.setInputFiles(filePath);
//       await page.waitForTimeout(800);

//       log(`   → Uploaded to row ${i + 1}: ${fileName}`);
//     }, `Upload PDF row ${i + 1}`);
//   }

//   log(`\n🎉 All ${pdfPaths.length} PDF(s) uploaded`);
// }

async function uploadPDFsOneByOne(page, folderName = 'upload_documents') {
  let pdfPaths = collectPDFs(folderName);

  // 🔴 Remove invoice.pdf (case-insensitive)
  pdfPaths = pdfPaths.filter(filePath => {
    const fileName = path.basename(filePath).toLowerCase();
    return fileName !== 'invoice.pdf';
  });

  if (pdfPaths.length === 0) {
    log('⚠️ No PDFs found (after skipping invoice.pdf) — skipping upload');
    return;
  }

  for (let i = 0; i < pdfPaths.length; i++) {
    const filePath = pdfPaths[i];
    const fileName = path.basename(filePath);

    log(`\n🔄 Trying [Upload PDF ${i + 1}/${pdfPaths.length}: ${fileName}]...`);

    await safeAction(async () => {
      const inputsBefore = await page.locator(LOC.ConclusionSection.uploadInput).count();

      await page.click(LOC.ConclusionSection.uploadAddLabel);
      log(`   → Clicked ADD (row ${i + 1})`);

      await page.waitForFunction(
        countBefore => document.querySelectorAll('input[id="inputGroupFile04"]').length > countBefore,
        inputsBefore,
        { timeout: 5000 }
      );

      await page.waitForTimeout(400);

      const targetInput = page.locator(LOC.ConclusionSection.uploadInput).nth(i);
      await targetInput.setInputFiles(filePath);
      await page.waitForTimeout(800);

      log(`   → Uploaded to row ${i + 1}: ${fileName}`);
    }, `Upload PDF row ${i + 1}`);
  }

  log(`\n🎉 All ${pdfPaths.length} PDF(s) uploaded (excluding invoice.pdf)`);
}

async function uploadInvoicePDF(page) {
  log('\n🔄 Trying [Upload Invoice PDF]...');
  const filePath = path.join(os.homedir(), 'Desktop', 'upload_documents', 'invoice.pdf');

  if (!fs.existsSync(filePath)) {
    log(`❌ Failed [Upload Invoice PDF]: File not found at ${filePath}`);
    return;
  }

  await safeAction(async () => {
    await page.locator(LOC.ConclusionSection.invoiceAddLabel).click();
    log('   → Clicked correct ADD (Invoice section)');

    const fileInput = page.locator(LOC.ConclusionSection.uploadInput).last();
    await fileInput.waitFor({ state: 'visible' });

    await fileInput.setInputFiles(filePath);
    log('   → Invoice file set');
  }, 'Upload Invoice PDF');
}
async function uploadInsuredPartPDF(page) {
  log('\n🔄 Trying [Upload Insured Part PDF]...');

  const filePath = path.join(
    os.homedir(),
    'Desktop',
    'upload_documents',
    'Insured Part.pdf'
  );

  if (!fs.existsSync(filePath)) {
    log(`❌ File not found: ${filePath}`);
    return;
  }

  await safeAction(async () => {
    // Click ADD button
    await page.locator(LOC.OthersSection.addDocumentLabel).click();

    // Wait for file input
    const fileInput = page.locator(LOC.OthersSection.docMember);
    await fileInput.waitFor({ state: 'visible' });

    // Upload file
    await fileInput.setInputFiles(filePath);

    log('   → Insured Part PDF uploaded successfully');
  }, 'Upload Insured Part PDF');
}

// ─── Fill Form ────────────────────────────────────────────────────────────────

async function fillForm(page) {
  const report = JSON.parse(fs.readFileSync(path.join(__dirname, 'inputs', 'reportvalues.json'), 'utf-8'));
  log('\n📋 Starting fillForm...');

  // ── Hospital Section ───────────────────────────────────────────────────────

  await safeAction(async () => {
    await page.waitForTimeout(1000);
    await page.click(LOC.HospitalSection.sectionButton);
  }, 'Open Hospital Verification Section');

  await safeAction(async () => {
    await page.waitForTimeout(1000);
    await page.selectOption(LOC.HospitalSection.visitToHospital, 'yes');
  }, 'Visit To Hospital');

  await safeAction(async () => {
    await page.waitForTimeout(1000);
    await page.fill(LOC.HospitalSection.hospitalRegistrationNumber, report?.['registration no']);
  }, 'Hospital Registration Number');

  await safeAction(async () => {
    await page.waitForTimeout(1000);
    const isOT =
      normalize(report?.['ot register copy']) === 'no' ||
      normalize(report?.['ot register copy']) === 'not provided' ||
      normalize(report?.['ot register copy']) === 'na';
    const dropdown = page.locator(LOC.HospitalSection.OT);
    if (await dropdown.count() === 0) throw new Error('OT dropdown not found in DOM');
    await dropdown.selectOption(isOT ? 'no' : 'yes');
    log(`   → OT set to: ${isOT ? 'no' : 'yes'}`);
  }, 'OT');

  await safeAction(async () => {
    await page.selectOption(LOC.HospitalSection.relativeNearHospital, 'no');
  }, 'Relative Near Hospital');

  await safeAction(async () => {
    await page.fill(LOC.HospitalSection.comments, 'NA');
  }, 'Comments');

  await safeAction(async () => {
    const ipd = normalize(report?.['ipd register entry']);
    const isNotProvided = ipd === 'not provided' || ipd === 'tertiary care hospital- not provided' || ipd === 'no';
    const dropdown = page.locator(LOC.HospitalSection.IPRegisterEntry);
    if (await dropdown.count() === 0) throw new Error('IPD dropdown not found in DOM');
    await dropdown.selectOption(isNotProvided ? 'no' : 'yes');

    if (isNotProvided) {
      const reason = page.locator(LOC.HospitalSection.IPRegisterEntryReason);
      if (await reason.count() > 0) await reason.fill(report?.['ipd register entry']);
      log('   → IPD Not Provided → NO');
    } else {
      await page.locator(LOC.HospitalSection.IPRegisterEntryYes).check();
      log('   → IPD Verified → YES');
    }
  }, 'IPD Register Entry');

  await safeAction(async () => {
    await page.waitForTimeout(1000);
    await page.selectOption(LOC.HospitalSection.ICPsCollected, 'yes');
  }, 'ICPs Collected');

  await safeAction(async () => {
    await page.locator(LOC.HospitalSection.ICPsNumber).fill('00');
  }, 'ICPs Number');

  await safeAction(async () => {
    await page.locator(LOC.HospitalSection.ICPsCollectedFindings).fill(report?.['indoor case paper observation']);
  }, 'ICPs Collected Findings');

  await safeAction(async () => {
    await page.waitForTimeout(1000);
    await page.selectOption(LOC.HospitalSection.AnyOtherDispensaryNoted, 'no');
  }, 'Any Other Dispensary Noted');

  await safeAction(async () => {
    const billBookCollected = normalize(report?.['carbon copy of the bill']);
    const isNotProvided =
      billBookCollected === 'not provided' ||
      billBookCollected === 'tertiary care hospital- not provided' ||
      billBookCollected === 'no';
    const dropdown = page.locator(LOC.HospitalSection.billBookCollected);
    if (await dropdown.count() === 0) throw new Error('Bill Book dropdown not found in DOM');
    await dropdown.selectOption(isNotProvided ? 'no' : 'yes');

    if (isNotProvided) {
      await page.locator(LOC.HospitalSection.billBookCollectedReason).fill(report?.['carbon copy of the bill']);
      log('   → Bill Book → NO');
    } else {
      await page.locator(LOC.HospitalSection.billBookCollectedObservations).fill(report?.['carbon copy of the bill']);
      log('   → Bill Book → YES');
    }
  }, 'Bill Book Collected');

  await safeAction(async () => {
    const tariff = normalize(report?.['tariff list']);
    const isNotProvided =
      tariff === 'tertiary care hospital- not provided' ||
      tariff === 'not provided' ||
      tariff === 'no';
    await page.locator(LOC.HospitalSection.tariffDetailsCardCollected).selectOption(isNotProvided ? 'no' : 'yes');

    if (isNotProvided) {
      await page.locator(LOC.HospitalSection.tariffDetailsCardCollectedReason).fill(report?.['tariff list'] || 'NA');
      log('   → Tariff → NO');
    } else {
      await page.locator(LOC.HospitalSection.tariffDetailsCardObservations).fill(report?.['tariff list'] || 'NA');
      log('   → Tariff → YES');
    }
  }, 'Tariff List');

  await safeAction(async () => {
    await page.waitForTimeout(1000);
    await page.selectOption(LOC.HospitalSection.hospitalAuthorityStatement, 'yes');
  }, 'Hospital Authority Statement');

  await safeAction(async () => {
    await page.locator(LOC.HospitalSection.hospitalAuthorityStatementObservations).fill(report?.['hospital visit findings.']);
  }, 'Hospital Authority Statement Observations');

  await safeAction(async () => {
    await page.waitForTimeout(1000);
    await page.selectOption(LOC.HospitalSection.hospitalAuthorityPED, 'no');
  }, 'Hospital Authority PED');

  await safeAction(async () => {
    const isSurgical = normalize(report?.['line of treatment']) === 'surgical';
    if (isSurgical) {
      await page.locator(LOC.HospitalSection.managementCaseSurgical).check();
      log('   → Surgical Management selected');
    } else {
      await page.locator(LOC.HospitalSection.managementCaseMedical).check();
      const obs = page.locator(LOC.HospitalSection.medicalManagementActiveLineOfTreatment);
      if (await obs.count() > 0) await obs.fill(report?.['line of treatment'] || 'NA');
      log('   → Medical Management selected');
    }
  }, 'Management Case');

  await safeAction(async () => {
    await page.locator(LOC.HospitalSection.noMlcApplicable).check();
  }, 'MLC Details (Not Applicable)');

  // ── Treating Doctor ────────────────────────────────────────────────────────

  await safeAction(async () => {
    await page.locator(LOC.HospitalSection.nameOfDoctor).fill(report?.['treating doctor name']);
  }, 'Doctor Name');

  await safeAction(async () => {
    await page.locator(LOC.HospitalSection.doctorQualification).fill(report?.['qualification']);
  }, 'Doctor Qualification');

  await safeAction(async () => {
    await page.locator(LOC.HospitalSection.registrationNumber).fill(report?.['registration number']);
  }, 'Doctor Registration Number');

  await safeAction(async () => {
    const metDoctor = normalize(report?.['details of statement issued by treating doctor visit findings']);
    const isNo =
      metDoctor === 'no' ||
      metDoctor === '' ||
      metDoctor === 'not provided' ||
      metDoctor === 'hospital non cooperative' ||
      metDoctor === 'na';

    await page.selectOption(LOC.HospitalSection.treatingDoctorStatementCollected, isNo ? 'no' : 'yes');

    // await page.locator(LOC.HospitalSection.treatingDoctorStatementCollectedReason).fill(
    //   report?.['details of statement issued by treating doctor visit findings'] || ''
    // );

    log(`   → Met Doctor → ${isNo ? 'NO' : 'YES'}`);
  }, 'Treating Doctor Statement Collected');

  await safeAction(async () => {
    const discrepancy = (report?.['any discrepancy / background'] || '').trim();
    const hasDiscrepancy = discrepancy && normalize(discrepancy) !== 'no';
    if (hasDiscrepancy) {
      await page.selectOption(LOC.HospitalSection.preExistingDiseaseAnyDiscrepancy, 'yes');
      await page.locator(LOC.HospitalSection.preExistingDiseaseAnyDiscrepancyYes).fill(report?.['any discrepancy / background']);
      log('   → Discrepancy → YES');
    } else {
      await page.selectOption(LOC.HospitalSection.preExistingDiseaseAnyDiscrepancy, 'no');
      log('   → Discrepancy → NO');
    }
  }, 'Discrepancy');

  // ── Lab Section ────────────────────────────────────────────────────────────

  await safeAction(async () => {
    await page.selectOption(LOC.LabSection.billBookVisitDone, 'yes');
  }, 'Bill Book Visit Done');

  await safeAction(async () => {
    await page.locator(LOC.LabSection.billBookFindings).fill(report?.['pathology manual register & visit findings']);
  }, 'Bill Book Findings');

  await safeAction(async () => {
    await page.locator(LOC.LabSection.labName).fill(report?.['pathology center name']);
  }, 'Lab Name');

  await safeAction(async () => {
    await page.locator(LOC.LabSection.labLocation).fill(report?.['address._2']);
  }, 'Lab Location');

  await safeAction(async () => {
    const isInHouse = normalize(report?.['pathology center name']) === 'in house';
    await page.selectOption(LOC.LabSection.inHouse, isInHouse ? 'yes' : 'no');
    if (!isInHouse) {
      await page.locator(LOC.LabSection.inHouseNoDistance).fill(report?.['pathology center name']);
    }
    log(`   → Lab In House → ${isInHouse ? 'YES' : 'NO'}`);
  }, 'Lab In House');

  await safeAction(async () => {
    await page.selectOption(LOC.LabSection.labRegisterEntryVerified, 'yes');
  }, 'Lab Register Entry Verified');

  await safeAction(async () => {
    await page.locator(LOC.LabSection.labRegisterEntryVerifiedYes).check();
  }, 'Lab Register Entry - Matching with Claim Document');

  await safeAction(async () => {
    await page.selectOption(LOC.LabSection.billBook, 'yes');
  }, 'Lab Bill Book');

  await safeAction(async () => {
    await page.locator(LOC.LabSection.billBookYes).check();
  }, 'Lab Bill Book - Matching with Claim Document');

  await safeAction(async () => {
    await page.selectOption(LOC.LabSection.reportsValidation, 'yes');
  }, 'Reports Validation');

  await safeAction(async () => {
    await page.locator(LOC.LabSection.nameOfEmpanelledPathologist).fill(report?.['pathologist doctor name']);
  }, 'Name Of Empanelled Pathologist');

  await safeAction(async () => {
    await page.locator(LOC.LabSection.billBookRegNo).fill(report?.['registration no_2']);
  }, 'Bill Book Reg No');

  await safeAction(async () => {
    await page.selectOption(LOC.LabSection.pastRecordsChecked, 'yes');
  }, 'Past Records Checked');

  await safeAction(async () => {
    await page.locator(LOC.LabSection.labVerificationSummary).fill(
      report?.['details of statement issued by pathologist doctor visit findings'] || 'Not Provided'
    );
  }, 'Lab Verification Summary');

  await safeAction(async () => {
    await page.selectOption(LOC.LabSection.labOption, 'Pathology Lab');
  }, 'Lab Option');

  // ── Chemist Section ────────────────────────────────────────────────────────

  await safeAction(async () => {
    await page.selectOption(LOC.ChemistSection.chemistVerificationVisitDone, 'yes');
  }, 'Chemist Verification Visit Done');

  await safeAction(async () => {
    await page.locator(LOC.ChemistSection.pharmacyName).fill(report?.['pharmacy name']);
  }, 'Pharmacy Name');

  await safeAction(async () => {
    const isInHouse = normalize(report?.['pharmacy name']) === 'in house';
    await page.selectOption(LOC.ChemistSection.pharmacyInHouse, isInHouse ? 'yes' : 'no');
    log(`   → Pharmacy In House → ${isInHouse ? 'YES' : 'NO'}`);
  }, 'Pharmacy In-House');

  await safeAction(async () => {
    await page.selectOption(LOC.ChemistSection.pharmacyBillBook, 'yes');
  }, 'Pharmacy Bill Book');

  await safeAction(async () => {
    await page.locator(LOC.ChemistSection.pharmacyBillBookYes).check();
  }, 'Pharmacy Bill Book - Matching with Claim Documents');

  await safeAction(async () => {
    const raw = report?.['bill verification findings'];
    const value = normalize(raw);
    const isNo = value === 'na' || value === 'no';
    await page.selectOption(LOC.ChemistSection.pharmacyBillRecords, isNo ? 'others' : 'carbon copies');
    if (isNo) {
      await page.fill(LOC.ChemistSection.pharmacyBillRecordsFindings, 'NO');
      log('   → Bill Verification → NO');
    } else {
      await page.fill(LOC.ChemistSection.pharmacyBillRecordsFindings, report?.['bill verification findings'] || 'NA');
      log('   → Bill Verification → Carbon Copies');
    }
  }, 'Bill Verification');

  await safeAction(async () => {
    await page.selectOption(LOC.ChemistSection.purchaseInvoiceCollected, 'yes');
  }, 'Purchase Invoice Collected');

  await safeAction(async () => {
    await page.selectOption(LOC.ChemistSection.purchaseInvoiceCollectedYesVerified, 'no');
  }, 'Purchase Invoice Verified');

  await safeAction(async () => {
    await page.selectOption(LOC.ChemistSection.pharmacyPastRecordsChecked, 'yes');
  }, 'Pharmacy Past Records Checked');

  await safeAction(async () => {
    await page.selectOption(LOC.ChemistSection.chemistStatementCollected, 'no');
  }, 'Chemist Statement Collected');

  await safeAction(async () => {
    await page.locator(LOC.ChemistSection.chemistStatementCollectedReason).fill('Not Provided');
  }, 'Chemist Statement Collected Reason');

  await safeAction(async () => {
    await page.locator(LOC.ChemistSection.overAllChemistVerificationSummary).fill('Not Provided');
  }, 'Overall Chemist Verification Summary');

  await safeAction(async () => {
    await page.locator(LOC.ChemistSection.labOptionPastRecords).fill(report?.['past history'] || 'Not Provided');
  }, 'Past Record Details');

  await safeAction(async () => {
    await page.locator(LOC.ChemistSection.labOptionOtherObservationFindings).fill(report?.['pharmacy visit findings']);
  }, 'Any Other Observation/Findings');

  await safeAction(async () => {
    await page.selectOption(LOC.ChemistSection.labOptionPEDFindings, 'No');
  }, 'PED Findings');

  await safeAction(async () => {
    await page.locator(LOC.ChemistSection.overAllHospitalVerificationFindings).fill(report?.['overall findings and details']);
  }, 'Overall Hospital Verification Findings');

  await page.waitForTimeout(1000);

  // ── Home Visit Section ─────────────────────────────────────────────────────

  await safeAction(async () => {
    await page.locator(LOC.HomeVisitSection.sectionButton).click();
  }, 'Open Home Visit Section');

  await safeAction(async () => {
    await page.selectOption(LOC.HomeVisitSection.visitDone, 'Yes');
  }, 'Home Visit Done');

  await safeAction(async () => {
    await page.selectOption(LOC.HomeVisitSection.appointmentTaken, 'Yes');
  }, 'Appointment Taken');

  await safeAction(async () => {
    await page.locator(LOC.HomeVisitSection.nameOfInsuredWithWhomAppointmentWasTaken).fill(report?.['patient name']);
  }, 'Name Of Insured With Whom Appointment Was Taken');

  await safeAction(async () => {
    await page.locator(LOC.HomeVisitSection.mobileNo).fill(report?.['residence contact no']);
  }, 'Mobile Number');

  await safeAction(async () => {
    await page.locator(LOC.HomeVisitSection.memberAddress).fill(report?.['residence address']);
  }, 'Member Address');

  await safeAction(async () => {
    await page.locator(LOC.HomeVisitSection.nameOfPatient).fill(report?.['patient name']);
  }, 'Patient Name');

  await safeAction(async () => {
    const dob = formatDate(report?.['patient dob']);
    if (!dob) throw new Error('Invalid or missing date of birth in report');
    await page.locator(LOC.HomeVisitSection.dateOfBirthOfPatient).fill(dob);
  }, 'Date Of Birth');

  await safeAction(async () => {
    const value = formatGender(report?.['gender']);
    if (!value || value === 'Invalid') throw new Error(`Invalid gender value: ${report?.['gender']}`);
    await page.selectOption(LOC.HomeVisitSection.gender, value);
  }, 'Gender');

  await safeAction(async () => {
    await page.selectOption(LOC.HomeVisitSection.statementCollected, 'Yes');
  }, 'Statement Collected');

  await safeAction(async () => {
    await page.locator(LOC.HomeVisitSection.statementCollectedFinding).fill(report?.['remarks']);
  }, 'Statement Collected Finding');

  await safeAction(async () => {
    await page.selectOption(LOC.HomeVisitSection.anyDiscrepancies, 'No');
  }, 'Any Discrepancies');

  await safeAction(async () => {
    await page.selectOption(LOC.HomeVisitSection.anyPEDNonDisclosureFindings, 'No');
  }, 'Any PED Non-Disclosure Findings');

  await safeAction(async () => {
    await page.selectOption(LOC.HomeVisitSection.pastDocumentsCollected, 'No');
    await page.locator(LOC.HomeVisitSection.pastDocumentsCollectedReason).fill('not provided');
  }, 'Past Documents Collected');

  await safeAction(async () => {
    await page.selectOption(LOC.HomeVisitSection.KYCDocumentsCollected, 'Yes');
    await page.locator(LOC.HomeVisitSection.KYCDocumentsCollectedYes).check();
  }, 'KYC Documents Collected');

  // ── Others Section ─────────────────────────────────────────────────────────

  await safeAction(async () => {
    await page.locator(LOC.OthersSection.notVVApplicable).check();
  }, 'Not VV Applicable');

  await safeAction(async () => {
    await page.locator(LOC.OthersSection.notVFPApplicable).check();
  }, 'Not VFP Applicable');

  await safeAction(async () => {
    await page.locator(LOC.OthersSection.notICFCApplicable).check();
  }, 'Not ICFC Applicable');

  // await safeAction(async () => {
  //   await page.locator(LOC.OthersSection.addDocumentLabel).click();
  // }, 'Click ADD (Document)');

  // await safeAction(async () => {
  //   await page.locator(LOC.OthersSection.docMember).setInputFiles(
  //     path.join(os.homedir(), 'Desktop', 'upload_documents', 'Insured Part.pdf')
  //   );
  // }, 'Upload Insured Part Document');
  await uploadInsuredPartPDF(page);

  await page.waitForTimeout(2000);

  // ── Office/School/College Visit Section ────────────────────────────────────

  await safeAction(async () => {
    await page.getByRole('button', { name: LOC.OfficeVisitSection.sectionButtonName }).click();
  }, 'Open Office/School/College Visit Section');

  await safeAction(async () => {
    await page.selectOption(LOC.OfficeVisitSection.officeVisit, 'No');
  }, 'Office Visit');

  await safeAction(async () => {
    await page.locator(LOC.OfficeVisitSection.officeVisitNotDoneReason).fill('NA');
  }, 'Office Visit Not Done Reason');

  log('\n✅ fillForm completed — submit the form manually, then click Run Conclusion.');
}

// ─── Conclusion ───────────────────────────────────────────────────────────────

async function conclusion(page) {
  const report = JSON.parse(fs.readFileSync(path.join(__dirname, 'inputs', 'reportvalues.json'), 'utf-8'));
  log('\n📋 Starting conclusion...');

  await safeAction(async () => {
    await page.locator(LOC.ConclusionSection.sectionButton).click();
  }, 'Open Verification Conclusion Section');

  await safeAction(async () => {
    await page.locator(LOC.ConclusionSection.finalObservationSuggestion).fill(report?.['conclusion / recommendation']);
  }, 'Final Observation');

  await uploadPDFsOneByOne(page, 'upload_documents');

  await uploadInvoicePDF(page);

  await safeAction(async () => {
    await page.locator(LOC.ConclusionSection.expenditureRemark).fill('NA');
  }, 'Expenditure Remark');

  await safeAction(async () => {
    await page.locator(LOC.ConclusionSection.expenditureAmount).fill('00');
  }, 'Expenditure Amount');

  log('\n✅ Conclusion completed — submit manually.');
}

// ─── Find Claim ───────────────────────────────────────────────────────────────

// async function findClaim(page, claimNumber) {
//   log(`\n🔍 Finding claim: ${claimNumber}`);
//   try {
//     log('🔄 Trying [Open Claim Section]...');
//     await page.waitForTimeout(1000);
//     await page.locator('.card_section a').nth(4).click();
//     // await page.click('#root > div > div.App > div > div.sidebar.sidebar-fixed > ul > div > div.simplebar-wrapper > div.simplebar-mask > div > div > div > li:nth-child(2) > a');
//     log('✅ Done [Open Claim Section]');

//     log('🔄 Trying [Wait for search input]...');
//     await page.waitForTimeout(1000);
//     await page.waitForSelector(LOC.ClaimSearch.searchInput, { timeout: 10000 });
//     log('✅ Done [Wait for search input]');

//     log('🔄 Trying [Fill Claim Number]...');
//     await page.fill(LOC.ClaimSearch.searchInput, claimNumber);
//     log(`✅ Done [Fill Claim Number]: ${claimNumber}`);

//     await page.waitForTimeout(1000);

//     await Promise.race([
//       page.locator(LOC.ClaimSearch.noRecordsText).waitFor(),
//       page.locator(LOC.ClaimSearch.firstResultLink).first().waitFor(),
//     ]);

//     const noRecord = await page.locator(LOC.ClaimSearch.noRecordsText).count();
//     if (noRecord > 0) {
//       log(`❌ Failed [Find Claim]: No records found for claim number ${claimNumber}`);
//       return false;
//     }

//     await page.waitForTimeout(1000);
//     await page.locator(LOC.ClaimSearch.firstResultLink).first().click();
//     await page.waitForTimeout(1000);
//     log('✅ Done [Open Claim]: Claim opened successfully');
//     return true;
//   } catch (err) {
//     log(`❌ Failed [Find Claim]: ${err.message}`);
//     return false;
//   }
// }

async function findClaim(page, claimNumber) {
  log(`\n🔍 Finding claim: ${claimNumber}`);

  const claimSections = [
  '#root > div > div.App > div > div.sidebar.sidebar-fixed > ul > div > div.simplebar-wrapper > div.simplebar-mask > div > div > div > li:nth-child(2) > a',

  '#root > div > div.App > div > div.wrapper.d-flex.flex-column.min-vh-100.bg-light > div.body.flex-grow-1.px-3 > div > div > div > div.row.card_section.mt-4 > div:nth-child(1) > div > div > div > div > a > h3',

  '#root > div > div.App > div > div.wrapper.d-flex.flex-column.min-vh-100.bg-light > div.body.flex-grow-1.px-3 > div > div > div > div.row.card_section.mt-4 > div:nth-child(2) > div > div > div > div > a > h3',

  '#root > div > div.App > div > div.wrapper.d-flex.flex-column.min-vh-100.bg-light > div.body.flex-grow-1.px-3 > div > div > div > div.row.card_section.mt-4 > div:nth-child(3) > div > div > div > div > a > h3',

  '#root > div > div.App > div > div.wrapper.d-flex.flex-column.min-vh-100.bg-light > div.body.flex-grow-1.px-3 > div > div > div > div.row.card_section.mt-4 > div:nth-child(4) > div > div > div > div > a > h3',

  '#root > div > div.App > div > div.wrapper.d-flex.flex-column.min-vh-100.bg-light > div.body.flex-grow-1.px-3 > div > div > div > div.row.card_section.mt-4 > div:nth-child(5) > div > div > div > div > a > h3',

  '#root > div > div.App > div > div.wrapper.d-flex.flex-column.min-vh-100.bg-light > div.body.flex-grow-1.px-3 > div > div > div > div.row.card_section.mt-4 > div:nth-child(6) > div > div > div > div > a > h3',

  '#root > div > div.App > div > div.wrapper.d-flex.flex-column.min-vh-100.bg-light > div.body.flex-grow-1.px-3 > div > div > div > div.row.card_section.mt-4 > div:nth-child(7) > div > div > div > div > a > h3',
];

  const dashboardSelector = '#root > div > div.App > div > div.sidebar.sidebar-fixed > ul > div > div.simplebar-wrapper > div.simplebar-mask > div > div > div > li:nth-child(1) > a';

  for (let i = 0; i < claimSections.length; i++) {
    const section = claimSections[i];

    log(`\n🔄 Trying Section ${i + 1}`);

    try {
      // 🔹 Open section
      await page.locator(section).click();
      await page.waitForTimeout(1500);

      // 🔹 Wait for search
      await page.waitForSelector(LOC.ClaimSearch.searchInput, { timeout: 5000 });

      // 🔹 Fill claim number
      await page.fill(LOC.ClaimSearch.searchInput, claimNumber);
      await page.waitForTimeout(1000);
      await Promise.race([
        page.locator(LOC.ClaimSearch.noRecordsText).waitFor(),
        page.locator(LOC.ClaimSearch.firstResultLink).first().waitFor(),
      ]);
      await page.waitForTimeout(1000);

      const noRecord = await page.locator(LOC.ClaimSearch.noRecordsText).count();
      await page.waitForTimeout(1000);
      if (noRecord === 0) {
        // ✅ FOUND
        await page.locator(LOC.ClaimSearch.firstResultLink).first().click();
        log(`✅ Claim found in Section ${i + 1}`);

        await fillForm(page);
        return true;
      }

      log(`❌ Not found in Section ${i + 1}`);

    } catch (err) {
      log(`⚠️ Error in Section ${i + 1}: ${err.message}`);
    }

    // 🔴 Go back to dashboard (if not last)
    if (i < claimSections.length - 1) {
      log(`↩️ Going to Dashboard`);

      try {
        await page.locator(dashboardSelector).click();
        await page.waitForTimeout(1500);
      } catch (err) {
        log(`⚠️ Dashboard navigation failed: ${err.message}`);
      }
    }
  }

  log(`❌ Claim not found in any section`);
  return false;
}

// ─── Login ────────────────────────────────────────────────────────────────────

async function login(page) {
  log('\n🔄 Trying [Login]...');
  try {
    await page.goto(LOC.Login.url, { waitUntil: 'load' });
    await page.waitForSelector(L.username_path);
    await page.waitForSelector(L.password_path);
    await page.fill(L.username_path, L.USERNAME);
    await page.fill(L.password_path, L.PASSWORD);
    await page.waitForTimeout(4000);
    await page.click(L.LOGIN_BTN);
    await page.waitForLoadState('networkidle');
    log('✅ Done [Login]');
  } catch (err) {
    log(`❌ Failed [Login]: ${err.message}`);
    throw err;
  }
}

// ─── IPC: Start ───────────────────────────────────────────────────────────────

ipcMain.handle('start', async (event, { pdfPath, claimNumber }) => {
  try {
    log('===========================================');
    log('       CLAIM AUTOMATION SCRIPT');
    log('===========================================\n');

    if (!pdfPath || !fs.existsSync(pdfPath)) {
      log(`❌ PDF file not found: "${pdfPath}"`);
      return { success: false };
    }
    if (!claimNumber) {
      log('❌ Claim number cannot be empty.');
      return { success: false };
    }

    log(`✅ PDF Path: ${pdfPath}`);
    log(`✅ Claim Number: ${claimNumber}`);

    // Show upload_documents folder contents before running test.py
    log('\n📁 Files in Desktop/upload_documents:');
    collectPDFs('upload_documents');

    cleanReportValues();
    await runPythonScript(pdfPath);

    log('\n🔄 Trying [Launch Browser]...');
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    playwrightPage = await context.newPage();
    log('✅ Done [Launch Browser]');

    await login(playwrightPage);

    const claimFound = await findClaim(playwrightPage, claimNumber);
    if (!claimFound) {
      log('❌ Claim not found or could not be opened.');
      return { success: false };
    }

    await fillForm(playwrightPage);

    // Tell renderer to show Run Conclusion button
    mainWindow.webContents.send('form-done');

    return { success: true };
  } catch (err) {
    log(`❌ Fatal error: ${err.message}`);
    return { success: false };
  }
});

// ─── IPC: Run Conclusion ──────────────────────────────────────────────────────

ipcMain.handle('run-conclusion', async () => {
  try {
    if (!playwrightPage) {
      log('❌ No active browser session. Please run Start first.');
      return { success: false };
    }
    await conclusion(playwrightPage);
    return { success: true };
  } catch (err) {
    log(`❌ Conclusion error: ${err.message}`);
    return { success: false };
  }
});

// ─── IPC: List upload_documents PDFs ─────────────────────────────────────────

ipcMain.handle('list-pdfs', async () => {
  const folder = path.join(os.homedir(), 'Desktop', 'upload_documents');
  if (!fs.existsSync(folder)) return [];
  return fs
    .readdirSync(folder)
    .filter(f => f.toLowerCase().endsWith('.pdf'))
    .map(f => ({ name: f, path: path.join(folder, f) }));
});