import { MeetingRecording } from '../types/meeting';
import { createSyntheticDemoAudioUrl } from '../utils/audioSynthesizer';

export const SAMPLE_RECORDINGS: MeetingRecording[] = [
  {
    id: 'rec-sample-hinglish-01',
    title: 'Cataract Evaluation & Toric IOL Lens Selection',
    filename: 'ramesh_patel_cataract_toric_consult.m4a',
    uploadDate: '2026-10-10 14:30',
    duration: 215, // 3m 35s
    durationFormatted: '03:35',
    fileSizeFormatted: '4.8 MB',
    detectedLanguage: 'Hinglish (Hindi & English Bilingual)',
    languageMode: 'auto',
    isDemo: true,
    status: 'completed',
    clientId: 'client-101',
    clientName: 'Ramesh Patel',
    salespersonName: 'Dr. Arvind Mehta & Sunita (Counselor)',
    consultationType: 'Cataract Pre-Operative Assessment',
    estimatedConversionChance: 88,
    pitchAnalysis: {
      overallScore: 82,
      summary: 'Clear, confident pitch that tied the premium lens to the patient\'s own complaints and closed with a firm date. Cost and insurance for the lens upgrade were never discussed in the room.',
      ratings: { rapport: 4, needsDiscovery: 4, objectionHandling: 3, clarity: 5, closing: 4 },
      strengths: [
        'Linked the Toric lens directly to the patient\'s night-driving and reading complaints',
        'Answered the hospital-stay worry with specifics: 15-20 minutes, no injection, home in 2 hours',
        'Closed with a concrete surgery date and clear pre-op steps',
      ],
      missedOpportunities: [
        {
          seconds: 48,
          timestamp: '00:48',
          whatHappened: 'Recommended the premium lens without mentioning its price or what insurance covers',
          suggestion: 'The Toric lens costs more than the standard one. Let me show you what your insurance covers and what the difference would be, so there are no surprises.',
        },
        {
          seconds: 76,
          timestamp: '01:16',
          whatHappened: 'The daughter raised her father\'s diabetes; the reply covered surgery time but not diabetic safety',
          suggestion: 'Diabetes is common among our cataract patients. We check his sugar before surgery, and I\'ll explain exactly what we monitor so healing stays on track.',
        },
        {
          seconds: 158,
          timestamp: '02:38',
          whatHappened: 'Patient asked about restrictions; the answer listed rules without checking how manageable they felt',
          suggestion: 'Does 15 days of keeping water out of the eye sound manageable at home? We can give you a simple one-page routine to follow.',
        },
      ],
    },
    conversionTimeline: [
      { seconds: 0, timestamp: '00:00', score: 55, reason: 'Diagnosis explained: Grade 3 cataract in the right eye' },
      { seconds: 22, timestamp: '00:22', score: 66, reason: 'Patient confirms night-driving glare and trouble reading' },
      { seconds: 48, timestamp: '00:48', score: 62, reason: 'Premium Toric lens recommended over the standard lens' },
      { seconds: 76, timestamp: '01:16', score: 54, reason: 'Daughter raises diabetes and hospital-stay worries' },
      { seconds: 98, timestamp: '01:38', score: 80, reason: 'Reassured: 15-20 minutes, no injection, home in 2 hours; Thursday slot offered' },
      { seconds: 128, timestamp: '02:08', score: 86, reason: 'Pre-op drops and fitness reports accepted without objection' },
      { seconds: 158, timestamp: '02:38', score: 78, reason: 'Patient asks about recovery limits and bathing precautions' },
      { seconds: 178, timestamp: '02:58', score: 88, reason: 'Clear recovery answers; Friday post-op check agreed' },
    ],
    patientGoal: 'Severe glare and halos during night driving, with blurry double print when reading newspaper.',
    procedureDiscussed: 'Sutureless Phacoemulsification with AcrySof Toric IOL (Right Eye)',
    patientHesitation: 'Concern regarding post-operative diabetic recovery and strict 15-day water avoidance, plus insurance TPA upgrade co-pay.',
    decisionsMade: [
      'Confirmed Thursday morning 8:30 AM surgery date under topical drop anesthesia',
      'Selected premium AcrySof Toric IOL to neutralize 1.75 D corneal astigmatism',
      'Agreed to daycare admission protocol (discharge 2 hours post-op)'
    ],
    agreedNextSteps: [
      'Begin Moxifloxacin 0.5% eye drops 4 times daily starting Wednesday morning',
      'Submit physician pre-anesthesia fitness clearance and fasting blood sugar test by Wednesday 4:00 PM',
      'Report to daycare fasting on Thursday at 8:00 AM'
    ],
    conversionFactors: {
      positive: [
        'Patient strongly motivated to eliminate night driving glare and read newspaper without double print',
        'Daughter actively coordinating scheduling and committed to Thursday daycare slot',
        'Doctor clearly proved that standard spherical lens would leave high residual cylinder error'
      ],
      negative: [
        'Patient anxiety over diabetic glycemic management and strict 15-day water restriction',
        'Corporate TPA cashless policy covers monofocal base rate; awaiting upgrade co-pay pre-authorization'
      ]
    },
    conversionBarriers: [
      {
        id: 'b-101-1',
        category: 'Price / Affordability',
        description: 'TPA insurance pre-authorization query: Base policy covers standard monofocal; awaiting pre-auth approval for premium Toric co-pay.',
        supportingExcerpt: 'Papa diabetic hain... surgery slot confirm karte hain... TPA pre-authorization report submit karni hogi.',
        isExplicit: true
      },
      {
        id: 'b-101-2',
        category: 'Procedure Hesitation',
        description: 'Anxiety over diabetic vulnerability and lifestyle disruption during the 15-day postoperative healing window.',
        supportingExcerpt: 'Surgery ke kitne din baad main walk ya TV dekh sakta hoon? Aur nahane ke liye kya precaution leni hai?',
        isExplicit: true
      }
    ],
    audioUrl: createSyntheticDemoAudioUrl(215, 'Cataract Toric Consult'),
    transcript: [
      {
        id: 't-1',
        speaker: 'Dr. Arvind Mehta (Ophthalmologist)',
        timestamp: '00:00',
        startSeconds: 0,
        text: 'Ramesh ji, namaskar. Aapke right eye (OD) ki slit-lamp report aur visual acuity maine check ki. There is Grade 3 Nuclear Sclerosis cataract. Night driving me glare aur halos kafi pareshan kar rahe hain na?',
        translatedText: 'Ramesh ji, hello. I checked the slit-lamp report and visual acuity of your right eye. There is Grade 3 Nuclear Sclerosis cataract. Night driving glare and halos are troubling you significantly, right?'
      },
      {
        id: 't-2',
        speaker: 'Ramesh Patel (Patient)',
        timestamp: '00:22',
        startSeconds: 22,
        text: 'Haan doctor sahab, raat me car chalana bilkul mushkil ho gaya hai. Aur right eye se newspaper padhte waqt letters dhundhle aur double dikhte hain.',
        translatedText: 'Yes doctor, driving at night has become very difficult. And when reading the newspaper with the right eye, letters appear blurry and double.'
      },
      {
        id: 't-3',
        speaker: 'Dr. Arvind Mehta (Ophthalmologist)',
        timestamp: '00:48',
        startSeconds: 48,
        text: 'Aapke IOL Master biometry scan me cornea par 1.75 diopters ka corneal astigmatism aaya hai. Agar hum standard monofocal lens implant karenge, toh door ki vision ke liye bhi cylindrical chashma lagega. My strong recommendation is an AcrySof Toric IOL.',
        translatedText: 'Your IOL Master biometry scan shows 1.75 diopters of corneal astigmatism. If we implant a standard monofocal lens, you will still need cylindrical glasses for distance. My strong recommendation is an AcrySof Toric IOL.'
      },
      {
        id: 't-4',
        speaker: 'Sunita Patel (Daughter)',
        timestamp: '01:16',
        startSeconds: 76,
        text: 'Doctor, papa diabetic hain. Surgery kitni der ki hogi, aur hospital me kitna stay karna padega? Can we do it this week itself?',
        translatedText: 'Doctor, father is diabetic. How long will the surgery take, and how long will the hospital stay be? Can we schedule it this week itself?'
      },
      {
        id: 't-5',
        speaker: 'Dr. Arvind Mehta (Ophthalmologist)',
        timestamp: '01:38',
        startSeconds: 98,
        text: 'It is a sutureless phacoemulsification micro-incision surgery, just 15 to 20 minutes under topical drop anesthesia. No injection, no eye patch. Daycare procedure hai, 2 ghante baad ghar ja sakte hain. Thursday morning 8:30 AM ka surgery slot hum confirm karte hain.',
        translatedText: 'It is a sutureless phacoemulsification micro-incision surgery, taking just 15 to 20 minutes under topical drop anesthesia. No injection, no eye patch. It is a daycare procedure, and you can go home after 2 hours. We can confirm Thursday morning 8:30 AM for the surgery slot.'
      },
      {
        id: 't-6',
        speaker: 'Dr. Arvind Mehta (Ophthalmologist)',
        timestamp: '02:08',
        startSeconds: 128,
        text: 'Wednesday morning se Moxifloxacin 0.5% eye drops right eye me 4 times a day start karni hain. Aur Wednesday 4:00 PM tak pre-anesthesia physician clearance and fasting blood sugar test report submit karni hogi.',
        translatedText: 'Starting Wednesday morning, begin Moxifloxacin 0.5% eye drops in the right eye 4 times a day. And by Wednesday 4:00 PM, submit the physician fitness clearance and fasting blood sugar report.'
      },
      {
        id: 't-7',
        speaker: 'Ramesh Patel (Patient)',
        timestamp: '02:38',
        startSeconds: 158,
        text: 'Theek hai doctor sahab. Surgery ke kitne din baad main walk ya TV dekh sakta hoon? Aur nahane ke liye kya precaution leni hai?',
        translatedText: 'Understood doctor. How many days after surgery can I go for walks or watch TV? And what precautions should I take while bathing?'
      },
      {
        id: 't-8',
        speaker: 'Dr. Arvind Mehta (Ophthalmologist)',
        timestamp: '02:58',
        startSeconds: 178,
        text: 'TV aur walking next day se allowed hai with protective sunglasses. Sirf aankh me direct paani aur rub karna 15 din tak avoid karna hai. Friday morning 10:00 AM hum Day 1 post-op slit lamp check karenge.',
        translatedText: 'TV and walking are allowed from the next day with protective sunglasses. Only avoid splashing direct tap water into the eye or rubbing the eye for 15 days. On Friday morning at 10:00 AM, we will do the Day 1 post-op slit lamp check.'
      }
    ],
    summary: {
      executiveSummary: 'Comprehensive ophthalmic consultation for 64-year-old Ramesh Patel diagnosed with Grade 3 Nuclear Sclerosis cataract and 1.75 D corneal astigmatism in the right eye (OD). Dr. Mehta recommended sutureless phacoemulsification with a premium Toric IOL to correct distance vision without residual cylindrical error. Right eye cataract surgery is scheduled for Thursday at 8:30 AM.',
      keyTopics: [
        {
          title: 'Cataract Grading & Visual Impairment',
          summary: 'Right eye exhibits Grade 3 nuclear cataract causing severe glare and night-driving impairment.',
          bullets: [
            'Slit-lamp examination confirmed significant lens opacification.',
            'Patient complains of monocular diplopia when reading print.'
          ]
        },
        {
          title: 'Biometry & Toric IOL Selection',
          summary: 'IOL Master optical biometry revealed 1.75 D regular corneal astigmatism.',
          bullets: [
            'Standard spherical monofocal would leave patient reliant on cylindrical spectacles.',
            'Agreed to proceed with premium AcrySof Toric intraocular lens.'
          ]
        },
        {
          title: 'Surgical Protocol & Post-Op Care',
          summary: 'Topical micro-incision phacoemulsification scheduled under daycare admission.',
          bullets: [
            '15-20 minute sutureless procedure without retrobulbar block injection.',
            'Day 1 post-operative review scheduled for Friday at 10:00 AM.'
          ]
        }
      ],
      highlights: [
        'Confirmed suitability for premium Toric IOL implantation.',
        'Patient scheduled for daycare surgery on Thursday morning at 8:30 AM.',
        'Clearance protocol established for diabetic glycemic management.'
      ],
      challenges: [
        'Patient has Type 2 diabetes requiring tight pre-op fasting blood sugar verification.',
        'Astigmatic axis alignment must be precisely marked on surgical slit-lamp.'
      ],
      outcomes: [
        'Surgery booked for Thursday, October 16th at 8:30 AM.',
        'Pre-op Moxifloxacin drops prescribed starting Wednesday.',
        'Physician anesthesia clearance required by Wednesday 4:00 PM.'
      ],
      quickBulletOverview: [
        'Procedure: Right eye Phacoemulsification with Toric IOL.',
        'Surgery Date & Time: Thursday morning, 8:30 AM.',
        'Pre-op Medication: Moxifloxacin 0.5% drops 4x daily starting Wednesday.',
        'Clearance: Physician fitness & blood sugar report due Wednesday 4 PM.',
        'Follow-up: Day 1 post-op exam Friday at 10:00 AM.'
      ]
    },
    tasks: [
      {
        id: 't-eye-1',
        description: 'Start Moxifloxacin 0.5% antibiotic eye drops in right eye (OD) 4 times daily',
        owner: 'Patient (Ramesh Patel)',
        priority: 'High',
        dueDate: 'Wednesday morning',
        isExplicitDeadline: true,
        status: 'In Progress',
        sourceRef: 'Dr. Mehta at 02:08',
        recordingId: 'rec-sample-hinglish-01',
        recordingTitle: 'Cataract Evaluation & Toric IOL Lens Selection',
        clientId: 'client-101'
      },
      {
        id: 't-eye-2',
        description: 'Submit physician pre-anesthesia fitness certificate and fasting blood glucose report to daycare desk',
        owner: 'Sunita Patel (Daughter)',
        priority: 'High',
        dueDate: 'Wednesday, 4:00 PM',
        isExplicitDeadline: true,
        status: 'Pending',
        sourceRef: 'Dr. Mehta at 02:08',
        recordingId: 'rec-sample-hinglish-01',
        recordingTitle: 'Cataract Evaluation & Toric IOL Lens Selection',
        clientId: 'client-101'
      },
      {
        id: 't-eye-3',
        description: 'Report to Eye Surgery Daycare Unit fasting for minimum 6 hours',
        owner: 'Patient (Ramesh Patel)',
        priority: 'High',
        dueDate: 'Thursday, 8:00 AM',
        isExplicitDeadline: true,
        status: 'Pending',
        sourceRef: 'Dr. Mehta at 01:38',
        recordingId: 'rec-sample-hinglish-01',
        recordingTitle: 'Cataract Evaluation & Toric IOL Lens Selection',
        clientId: 'client-101'
      },
      {
        id: 't-eye-4',
        description: 'Perform Day 1 post-op slit lamp examination and measure intraocular pressure (IOP)',
        owner: 'Dr. Arvind Mehta',
        priority: 'High',
        dueDate: 'Friday, 10:00 AM',
        isExplicitDeadline: true,
        status: 'Pending',
        sourceRef: 'Dr. Mehta at 02:58',
        recordingId: 'rec-sample-hinglish-01',
        recordingTitle: 'Cataract Evaluation & Toric IOL Lens Selection',
        clientId: 'client-101'
      },
      {
        id: 't-eye-5',
        description: 'Order specific Toric IOL power and cylinder axis model from hospital pharmacy inventory',
        owner: 'Clinic Nurse / Optometrist',
        priority: 'High',
        dueDate: 'Wednesday EOD',
        isExplicitDeadline: false,
        status: 'Completed',
        sourceRef: 'Dr. Mehta at 00:48',
        recordingId: 'rec-sample-hinglish-01',
        recordingTitle: 'Cataract Evaluation & Toric IOL Lens Selection',
        clientId: 'client-101'
      }
    ],
    plan: {
      objective: 'Restore sharp uncorrected distance vision and eliminate 1.75 D corneal astigmatism in right eye via Toric IOL phacoemulsification.',
      phases: [
        {
          phaseName: 'Phase 1: Pre-Operative Preparation & Sterilization',
          durationOrPeriod: 'Wednesday (Day -1)',
          milestones: ['Commence topical Moxifloxacin drops', 'Physician anesthesia clearance filed'],
          keyDeliverables: ['Signed surgical consent form', 'Blood glucose < 150 mg/dL validation']
        },
        {
          phaseName: 'Phase 2: Daycare Surgery & Toric IOL Implantation',
          durationOrPeriod: 'Thursday Morning',
          milestones: ['Topical anesthesia & pupil dilation', 'Sutureless phacoemulsification', 'Axis-aligned Toric IOL positioning'],
          keyDeliverables: ['Uneventful operative log', 'Discharge with protective eye shield and sunglasses']
        },
        {
          phaseName: 'Phase 3: Post-Operative Rehabilitation',
          durationOrPeriod: 'Day 1 to Week 4',
          milestones: ['Day 1 review (Friday 10 AM)', 'Week 1 corneal clarity review', 'Week 4 final refractive check'],
          keyDeliverables: ['Post-op steroid-antibiotic drop taper chart', 'Final uncorrected vision 6/6']
        }
      ],
      recommendedNextSteps: [
        {
          step: 'Patient to arrange family escort for Thursday morning discharge',
          owner: 'Sunita Patel',
          suggestedDate: 'Wednesday evening',
          isExplicitDate: false
        },
        {
          step: 'Dispense protective eye shield and anti-inflammatory eye drop kit',
          owner: 'Clinic Pharmacy',
          suggestedDate: 'Thursday discharge',
          isExplicitDate: true
        }
      ],
      dependenciesAndBlockers: [
        'Surgery proceeding on Thursday depends on normal pre-op fasting blood sugar verification on Wednesday.',
        'Toric IOL implantation requires confirmed consignment delivery in OT before Thursday 8:00 AM.'
      ],
      timelineDetails: [
        {
          item: 'Pre-Op Eye Drops Initiation',
          date: 'Wednesday morning',
          dateType: 'stated',
          context: 'Stated by Dr. Mehta at 02:08'
        },
        {
          item: 'Physician Fitness Certificate Due',
          date: 'Wednesday, 4:00 PM',
          dateType: 'stated',
          context: 'Required deadline stated by Dr. Mehta'
        },
        {
          item: 'OT Admission & Right Eye Phacoemulsification',
          date: 'Thursday, 8:30 AM',
          dateType: 'stated',
          context: 'Confirmed surgical appointment locked with patient'
        },
        {
          item: 'Day 1 Post-Operative Slit-Lamp Review',
          date: 'Friday, 10:00 AM',
          dateType: 'stated',
          context: 'Stated by Dr. Mehta at 02:58'
        },
        {
          item: 'Week 1 Pressure & Wound Healing Exam',
          date: 'Next Thursday (Recommended)',
          dateType: 'ai-suggested',
          context: 'Standard clinical ophthalmology follow-up interval'
        }
      ],
      risksAndQuestions: [
        'Risk: Post-operative intraocular pressure spike in diabetic patient; monitor during Day 1 check.',
        'Precaution: Avoid any direct water contact, bending forward, or eye rubbing for 15 days.'
      ]
    },
    decisions: [
      {
        id: 'dec-1',
        decision: 'Perform right eye (OD) micro-incision phacoemulsification with AcrySof Toric IOL.',
        context: 'Patient has 1.75 D corneal astigmatism that would otherwise necessitate high cylindrical distance spectacles.',
        status: 'confirmed',
        impact: 'Delivers spectacle-independent distance vision and eliminates nuclear cataract.'
      },
      {
        id: 'dec-2',
        decision: 'Schedule procedure under topical anesthesia on Thursday at 8:30 AM.',
        context: 'Topical drop anesthesia avoids retrobulbar injection complications and expedites 2-hour discharge.',
        status: 'confirmed',
        impact: 'Safe daycare surgical protocol with minimal systemic disturbance.'
      },
      {
        id: 'dec-3',
        decision: 'Evaluate left eye (OS) cataract progression at 1-month post-op follow-up.',
        context: 'Left eye currently has mild Grade 1 cataract; conservative monitoring advised for now.',
        status: 'proposal_suggestion',
        impact: 'Prevents premature bilateral intervention.'
      }
    ]
  },
  {
    id: 'rec-sample-preop-04',
    title: 'Pre-Anesthesia Dilated Fundus & Retinal OCT Clearance',
    filename: 'ramesh_patel_retina_oct_clearance.mp3',
    uploadDate: '2026-10-10 16:45',
    duration: 145, // 2m 25s
    durationFormatted: '02:25',
    fileSizeFormatted: '3.1 MB',
    detectedLanguage: 'English & Hindi (Bilingual)',
    languageMode: 'auto',
    isDemo: true,
    status: 'completed',
    clientId: 'client-101',
    clientName: 'Ramesh Patel',
    salespersonName: 'Dr. Arvind Mehta (Ophthalmologist)',
    consultationType: 'Pre-Operative Retinal Clearance',
    estimatedConversionChance: 94,
    pitchAnalysis: {
      overallScore: 88,
      summary: 'Reassuring, results-first conversation that removed the patient\'s main fear. Little persuasion was needed, though the visit ended without checking for remaining questions.',
      ratings: { rapport: 5, needsDiscovery: 3, objectionHandling: 4, clarity: 5, closing: 4 },
      strengths: [
        'Opened with the good news the patient was anxious to hear',
        'Confirmed next steps with exact days and times',
      ],
      missedOpportunities: [
        {
          seconds: 30,
          timestamp: '00:30',
          whatHappened: 'Patient voiced his fear about diabetes; it was answered with clinical facts only',
          suggestion: 'It\'s completely natural to worry about that. The scans show your retina is healthy, so diabetes will not hold this surgery back.',
        },
        {
          seconds: 52,
          timestamp: '00:52',
          whatHappened: 'Ended on instructions without inviting any last questions',
          suggestion: 'Before you go, is there anything about Thursday that still worries you or your family?',
        },
      ],
    },
    conversionTimeline: [
      { seconds: 0, timestamp: '00:00', score: 80, reason: 'Scan results delivered: no diabetic retinopathy or macular edema' },
      { seconds: 30, timestamp: '00:30', score: 90, reason: 'Patient relieved that diabetes has not damaged the retina' },
      { seconds: 52, timestamp: '00:52', score: 94, reason: 'Retina cleared, lens calculation verified, Thursday plan confirmed' },
    ],
    patientGoal: 'Pre-operative dilated retinal exam to verify macular health before cataract surgery.',
    procedureDiscussed: 'Macular Spectral-Domain OCT & Dilated Funduscopy',
    patientHesitation: 'Fear of underlying diabetic retinopathy or vision-threatening macular changes.',
    decisionsMade: [
      'Retina cleared as completely healthy; patient approved for planned Thursday surgery',
      'No pre-op intravitreal injections or laser required'
    ],
    agreedNextSteps: [
      'Collect fasting blood glucose report Wednesday afternoon and submit to daycare desk'
    ],
    conversionFactors: {
      positive: [
        'OCT scan confirmed zero diabetic macular edema',
        'Patient relieved and fully committed to Thursday surgery date'
      ],
      negative: [
        'Final physical fitness certificate pending submission'
      ]
    },
    conversionBarriers: [
      {
        id: 'b-104-1',
        category: 'Information Request',
        description: 'Pre-anesthesia physician clearance letter and fasting blood sugar lab slip pending delivery to front desk.',
        supportingExcerpt: 'Kal Wednesday se drops start kar dijiyega and Thursday subah 8:00 AM hospital report kariyega.',
        isExplicit: true
      }
    ],
    audioUrl: createSyntheticDemoAudioUrl(145, 'Retina OCT Clearance'),
    transcript: [
      {
        id: 't-p1',
        speaker: 'Dr. Arvind Mehta (Ophthalmologist)',
        timestamp: '00:00',
        startSeconds: 0,
        text: 'Ramesh ji, dilation ke baad aapka right eye fundus examination aur Macular OCT scan complete ho gaya hai. Good news: There is no diabetic retinopathy and no macular edema.'
      },
      {
        id: 't-p2',
        speaker: 'Ramesh Patel (Patient)',
        timestamp: '00:30',
        startSeconds: 30,
        text: 'Bahut shukriya doctor. Mujhe darr tha ki diabetes ki wajah se parda kharab na ho gaya ho.'
      },
      {
        id: 't-p3',
        speaker: 'Dr. Arvind Mehta (Ophthalmologist)',
        timestamp: '00:52',
        startSeconds: 52,
        text: 'Retina bilkul healthy hai. Optic nerve healthy hai. Toric IOL calculation verify ho chuki hai. Kal Wednesday se drops start kar dijiyega and Thursday subah 8:00 AM hospital report kariyega.'
      }
    ],
    summary: {
      executiveSummary: 'Secondary pre-operative clearance consultation for Ramesh Patel following dilated fundus biomicroscopy and Spectral Domain Macular OCT. Retinal architecture is healthy with no diabetic retinopathy, microaneurysms, or macular edema. Final clinical clearance granted for Thursday cataract surgery.',
      keyTopics: [
        {
          title: 'Macular OCT & Retinal Screening',
          summary: 'High-resolution scan showed preserved foveal depression and intact photoreceptor integrity.',
          bullets: [
            'Zero signs of diabetic macular edema (DME).',
            'No retinal neovascularization.'
          ]
        },
        {
          title: 'Final Surgical Clearance',
          summary: 'Patient confirmed ready for Thursday morning phacoemulsification.',
          bullets: [
            'Toric power verification cross-checked with keratometry.',
            'Reminder provided regarding Wednesday drop regimen.'
          ]
        }
      ],
      highlights: [
        'Normal macular OCT confirms excellent visual prognosis post-cataract removal.',
        'Confirmed patient cleared for daycare surgery on Thursday.'
      ],
      challenges: [
        'Dilated pupils will cause transient light sensitivity for 4 hours post-visit.'
      ],
      outcomes: [
        'Final clearance signed and sent to Daycare OT coordinator.'
      ],
      quickBulletOverview: [
        'Macular OCT normal: no diabetic retinopathy.',
        'Patient fully cleared for Thursday 8:30 AM surgery.',
        'Confirmed Moxifloxacin drops start Wednesday.'
      ]
    },
    tasks: [
      {
        id: 't-p-task-1',
        description: 'Upload signed retinal OCT clearance report to patient hospital EHR chart',
        owner: 'Optometry Clinic Staff',
        priority: 'High',
        dueDate: 'Today EOD',
        isExplicitDeadline: true,
        status: 'Completed',
        sourceRef: 'Dr. Mehta at 00:52',
        recordingId: 'rec-sample-preop-04',
        recordingTitle: 'Pre-Anesthesia Dilated Fundus & Retinal OCT Clearance',
        clientId: 'client-101'
      }
    ],
    plan: {
      objective: 'Ensure zero posterior segment pathology prior to Toric IOL implantation.',
      phases: [
        {
          phaseName: 'Phase 1: Diagnostic Verification',
          durationOrPeriod: 'Completed',
          milestones: ['Macular OCT completed', 'Fundus photos archived'],
          keyDeliverables: ['Normal foveal contour report']
        }
      ],
      recommendedNextSteps: [
        {
          step: 'Check in with OT receptionist Thursday at 8:00 AM',
          owner: 'Patient (Ramesh Patel)',
          suggestedDate: 'Thursday 8:00 AM',
          isExplicitDate: true
        }
      ],
      dependenciesAndBlockers: ['All pre-op milestones met.'],
      timelineDetails: [
        {
          item: 'Surgical Admission',
          date: 'Thursday 8:00 AM',
          dateType: 'stated',
          context: 'Stated by Dr. Mehta'
        }
      ],
      risksAndQuestions: ['None; posterior segment clear.']
    },
    decisions: [
      {
        id: 'dec-p1',
        decision: 'Clear patient medically and surgically for Thursday morning Toric IOL implantation.',
        context: 'Dilated fundus examination and Macular OCT ruled out diabetic eye changes.',
        status: 'confirmed',
        impact: 'Permits scheduled procedure to proceed without postponement.'
      }
    ]
  },
  {
    id: 'rec-sample-english-02',
    title: 'Contoura Vision LASIK & Refractive Surgery Assessment',
    filename: 'ananya_verma_lasik_refractive_eval.wav',
    uploadDate: '2026-10-09 11:15',
    duration: 278, // 4m 38s
    durationFormatted: '04:38',
    fileSizeFormatted: '6.2 MB',
    detectedLanguage: 'English',
    languageMode: 'en',
    isDemo: true,
    status: 'completed',
    clientId: 'client-102',
    clientName: 'Ananya Verma',
    salespersonName: 'Dr. Shalini Rao & Pooja Sharma (Counselor)',
    consultationType: 'Refractive Surgery Consultation',
    estimatedConversionChance: 78,
    pitchAnalysis: {
      overallScore: 70,
      summary: 'Strong on eligibility and a confident recommendation, but price and the cheaper quote the patient is weighing were never raised, and no booking step was offered. The decision was left open.',
      ratings: { rapport: 4, needsDiscovery: 3, objectionHandling: 2, clarity: 5, closing: 2 },
      strengths: [
        'Used the patient\'s own test numbers to show she is a safe candidate',
        'Gave a precise answer on returning to screen work: Day 3',
      ],
      missedOpportunities: [
        {
          seconds: 68,
          timestamp: '01:08',
          whatHappened: 'Recommended Contoura Vision without explaining why it is worth more than cheaper blade LASIK',
          suggestion: 'You may see lower prices for blade LASIK elsewhere. Here is what Contoura adds for your eyes specifically, and we have EMI options if that helps.',
        },
        {
          seconds: 105,
          timestamp: '01:45',
          whatHappened: 'Patient asked about recovery; her screen-heavy job was not explored',
          suggestion: 'What does a normal work week look like for you? Let\'s pick a surgery day so your heaviest screen days fall after Day 3.',
        },
        {
          seconds: 135,
          timestamp: '02:15',
          whatHappened: 'The conversation ended on instructions with no booking step',
          suggestion: 'Shall I hold a surgery slot for next week while you stop the contact lenses? You can confirm in two days.',
        },
      ],
    },
    conversionTimeline: [
      { seconds: 0, timestamp: '00:00', score: 60, reason: 'Refraction confirmed stable in both eyes' },
      { seconds: 32, timestamp: '00:32', score: 68, reason: 'Patient keen to stop contact lenses after eight years and dry eyes' },
      { seconds: 68, timestamp: '01:08', score: 84, reason: 'Confirmed as a safe candidate; Contoura Vision recommended' },
      { seconds: 105, timestamp: '01:45', score: 70, reason: 'Worry about recovery time and returning to laptop work' },
      { seconds: 135, timestamp: '02:15', score: 78, reason: 'Reassured: screen work from Day 3; lens washout instructions given' },
    ],
    patientGoal: 'Desires complete spectacle freedom for sports and computer work without contact lens dryness.',
    procedureDiscussed: 'Customized Bilateral Contoura Vision Femto-LASIK',
    patientHesitation: 'Cost difference compared to competitor clinic microkeratome blade LASIK, plus fear of screen time recovery downtime.',
    decisionsMade: [
      'Approved patient as ideal candidate with 545 µm pachymetry and clear topography',
      'Recommended blade-free Contoura Vision over mechanical microkeratome for higher safety profile',
      'Agreed to provide 6-month zero-interest EMI financing option'
    ],
    agreedNextSteps: [
      'Counselor Pooja to email 6-month No-Cost EMI breakdown (₹15,833/month)',
      'Patient will confirm date with employer based on 48-hour screen recovery guideline'
    ],
    conversionFactors: {
      positive: [
        'High patient desire to ditch glasses for competitive badminton and daily activities',
        'Exceptional corneal thickness (545 µm) providing safe residual stromal bed',
        'Impressed by precision mapping and 20/15 visual acuity potential'
      ],
      negative: [
        'Cost comparison hesitation: Evaluating competitor budget blade LASIK offer (₹45,000 vs ₹95,000)',
        'Concern over screen time recovery downtime impacting design deadlines'
      ]
    },
    conversionBarriers: [
      {
        id: 'b-102-1',
        category: 'Price / Affordability',
        description: 'Competitor price objection: Patient actively comparing ₹95,000 blade-free Contoura quote against ₹45,000 blade LASIK.',
        supportingExcerpt: 'Exploring budget blade LASIK at competitor clinic (₹45,000 vs ₹95,000).',
        isExplicit: true
      },
      {
        id: 'b-102-2',
        category: 'Timing / Availability',
        description: 'Recovery downtime anxiety: Worried that digital screen restrictions will impair upcoming UI design sprints.',
        supportingExcerpt: 'Worried about screen time recovery downtime affecting work as a software UI designer.',
        isExplicit: true
      }
    ],
    audioUrl: createSyntheticDemoAudioUrl(278, 'LASIK Refractive Consult'),
    transcript: [
      {
        id: 't-e1',
        speaker: 'Dr. Shalini Rao (Cornea Specialist)',
        timestamp: '00:00',
        startSeconds: 0,
        text: 'Good morning Ananya. We have completed your refractive workup: your refraction is stable at -4.50 D in the right eye and -4.25 D in the left eye with minimal cylinder.'
      },
      {
        id: 't-e2',
        speaker: 'Ananya Verma (Patient)',
        timestamp: '00:32',
        startSeconds: 32,
        text: 'That is great doctor. I have worn contact lenses for eight years, but recently my eyes get dry by afternoon. Am I an eligible candidate for blade-free LASIK?'
      },
      {
        id: 't-e3',
        speaker: 'Dr. Shalini Rao (Cornea Specialist)',
        timestamp: '01:08',
        startSeconds: 68,
        text: 'Yes! Your corneal pachymetry is 545 microns in both eyes, which is well above the safe threshold. Your corneal topography shows perfectly regular symmetric bowtie astigmatism with zero keratoconus risk. We recommend Contoura Vision Femto-LASIK.'
      },
      {
        id: 't-e4',
        speaker: 'Ananya Verma (Patient)',
        timestamp: '01:45',
        startSeconds: 105,
        text: 'What is the recovery period, and when can I resume my laptop screen work?'
      },
      {
        id: 't-e5',
        speaker: 'Dr. Shalini Rao (Cornea Specialist)',
        timestamp: '02:15',
        startSeconds: 135,
        text: 'The femtosecond flap adheres tightly within 4 hours. You can resume screen work on Day 3 with preservative-free artificial tears. Discontinue soft contact lenses for 7 days prior to surgery.'
      }
    ],
    summary: {
      executiveSummary: 'Refractive surgery suitability evaluation for 27-year-old Ananya Verma with moderate myopia (-4.50 D OD, -4.25 D OS). Corneal tomography and anterior segment OCT confirmed 545 µm pachymetry, adequate residual stromal bed (>320 µm), and pristine topography. Patient is cleared for Contoura Vision customized Femto-LASIK.',
      keyTopics: [
        {
          title: 'Refractive Stability & Contact Lens Hygiene',
          summary: 'Documented 18-month refractive stability without keratoconic ectasia markers.',
          bullets: [
            'Tear break-up time is 8 seconds; mild contact-lens induced dry eye noted.',
            'Preservative-free carboxymethylcellulose eye drops prescribed.'
          ]
        },
        {
          title: 'Pachymetry & Contoura Vision Profile',
          summary: 'Central corneal thickness of 545 µm permits a 110 µm femtosecond flap and 65 µm ablation.',
          bullets: [
            'Calculated residual stromal bed exceeds 370 µm (safe standard is >300 µm).',
            'Topography-guided ablation ensures minimal post-op higher-order aberrations.'
          ]
        }
      ],
      highlights: [
        'Ideal cornea thickness (545 µm) and pristine topography.',
        'Cleared for Contoura Vision Femto-LASIK.'
      ],
      challenges: [
        'Requires strict cessation of contact lenses for 7 days before procedure.'
      ],
      outcomes: [
        'Prescribed pre-op lubricating eye drops.',
        'Surgery tentatively booked for next Saturday.'
      ],
      quickBulletOverview: [
        'Eligible for Contoura Vision Femto-LASIK.',
        'Corneal thickness: 545 µm (Safe).',
        'Stop soft contact lenses 7 days prior to treatment.',
        'Expected vision outcome: 20/20 uncorrected.'
      ]
    },
    tasks: [
      {
        id: 't-lasik-1',
        description: 'Discontinue soft contact lenses and wear spectacles continuously for 7 days before surgery',
        owner: 'Patient (Ananya Verma)',
        priority: 'High',
        dueDate: '7 days prior to surgery',
        isExplicitDeadline: true,
        status: 'In Progress',
        sourceRef: 'Dr. Rao at 02:15',
        recordingId: 'rec-sample-english-02',
        recordingTitle: 'Contoura Vision LASIK & Refractive Surgery Assessment',
        clientId: 'client-102'
      },
      {
        id: 't-lasik-2',
        description: 'Instill preservative-free carboxymethylcellulose 0.5% drops 4 times daily for tear film optimization',
        owner: 'Patient (Ananya Verma)',
        priority: 'Medium',
        dueDate: 'Daily ongoing',
        isExplicitDeadline: false,
        status: 'Pending',
        sourceRef: 'Dr. Rao at 02:15',
        recordingId: 'rec-sample-english-02',
        recordingTitle: 'Contoura Vision LASIK & Refractive Surgery Assessment',
        clientId: 'client-102'
      }
    ],
    plan: {
      objective: 'Achieve complete spectacle independence with customized wavefront-guided Femto-LASIK ablation.',
      phases: [
        {
          phaseName: 'Phase 1: Pre-LASIK Corneal Rest',
          durationOrPeriod: 'Next 7 Days',
          milestones: ['No contact lenses', 'Tear film lubrication'],
          keyDeliverables: ['Stabilized corneal curvature']
        },
        {
          phaseName: 'Phase 2: Contoura Vision Femto-LASIK Treatment',
          durationOrPeriod: 'Surgery Day',
          milestones: ['Femto flap creation', 'Excimer laser ablation', 'Flap repositioning'],
          keyDeliverables: ['Uncorrected 20/20 vision within 24 hours']
        }
      ],
      recommendedNextSteps: [
        {
          step: 'Patient to confirm Saturday surgery appointment with clinic counselor',
          owner: 'Ananya Verma',
          suggestedDate: 'Wednesday',
          isExplicitDate: false
        }
      ],
      dependenciesAndBlockers: ['Strict 7-day contact lens washout required.'],
      timelineDetails: [
        {
          item: 'Contact Lens Cessation',
          date: '7 days prior',
          dateType: 'stated',
          context: 'Mandatory clinical guideline stated by Dr. Rao'
        }
      ],
      risksAndQuestions: ['Mild transient glare or dry eye during the first 2-4 weeks.']
    },
    decisions: [
      {
        id: 'dec-lasik-1',
        decision: 'Approve patient for bilateral Contoura Vision customized Femto-LASIK.',
        context: 'Pachymetry (545 µm) and topography confirmed optimal safety margins.',
        status: 'confirmed',
        impact: 'Provides uncorrected visual acuity of 20/20.'
      }
    ]
  },
  {
    id: 'rec-sample-ops-hindi-03',
    title: 'Glaucoma IOP Progression & Visual Field Review',
    filename: 'suresh_gupta_glaucoma_iop_triage.mp3',
    uploadDate: '2026-10-08 17:00',
    duration: 185, // 3m 05s
    durationFormatted: '03:05',
    fileSizeFormatted: '3.6 MB',
    detectedLanguage: 'Hindi & Hinglish (Bilingual)',
    languageMode: 'hi',
    isDemo: true,
    status: 'completed',
    clientId: 'client-103',
    clientName: 'Suresh Gupta',
    salespersonName: 'Dr. Arvind Mehta & Amit Verma (Counselor)',
    consultationType: 'Glaucoma Management',
    estimatedConversionChance: 48,
    pitchAnalysis: {
      overallScore: 55,
      summary: 'Clinically accurate but delivered as a warning. The patient\'s travel problem, the real reason he misses his drops, was not solved, so adherence and return visits remain at risk.',
      ratings: { rapport: 2, needsDiscovery: 2, objectionHandling: 2, clarity: 4, closing: 3 },
      strengths: [
        'Stated the pressure readings and the risk plainly',
        'Set a specific 3-week review',
      ],
      missedOpportunities: [
        {
          seconds: 32,
          timestamp: '00:32',
          whatHappened: 'Patient admitted missing drops while travelling; the response was a reprimand rather than a solution',
          suggestion: 'Travel makes this hard for many patients. Let\'s set a phone reminder and give you a travel-size bottle so you never run out on the road.',
        },
        {
          seconds: 65,
          timestamp: '01:05',
          whatHappened: 'Shared worsening test results without saying what can still be protected',
          suggestion: 'The change is small and we caught it early. With the drops taken every night, we can protect the vision you have.',
        },
        {
          seconds: 100,
          timestamp: '01:40',
          whatHappened: 'Added a second medicine without checking he can manage the routine',
          suggestion: 'This is one combined drop at bedtime, so it is no harder than before. Would a monthly refill reminder from our clinic help?',
        },
      ],
    },
    conversionTimeline: [
      { seconds: 0, timestamp: '00:00', score: 55, reason: 'High eye pressure reading explained' },
      { seconds: 32, timestamp: '00:32', score: 42, reason: 'Patient admits missing night drops for two weeks while travelling' },
      { seconds: 65, timestamp: '01:05', score: 38, reason: 'Visual field loss has deepened; no gaps in drops allowed' },
      { seconds: 100, timestamp: '01:40', score: 48, reason: 'Treatment escalated; pressure check agreed in 3 weeks' },
    ],
    patientGoal: 'Follow-up for ocular hypertension (IOP 24 mmHg) and progressive visual field scotoma.',
    procedureDiscussed: 'Selective Laser Trabeculoplasty (SLT) / iStent MIGS Assessment',
    patientHesitation: 'Reluctance to undergo laser treatment without experiencing pain, plus missed eye drops during business trips.',
    decisionsMade: [
      'Prescribed Travoprost 0.004% drops at bedtime daily with zero missed doses',
      'Scheduled 3-week Goldman Applanation Tonometry repeat check',
      'If IOP persists above 21 mmHg, advance directly to Selective Laser Trabeculoplasty'
    ],
    agreedNextSteps: [
      'Counselor Amit to send visual field scotoma diagram and video to patient and family',
      'Patient will set daily phone alarm for 9:30 PM drop compliance during outstation travel'
    ],
    conversionFactors: {
      positive: [
        'Patient acknowledged elevated IOP reading (24 mmHg vs 16 mmHg)',
        'Understands relationship between missed drops and visual field defect progression'
      ],
      negative: [
        'Perception barrier: Hesitates on SLT laser because condition is painless and asymptomatic',
        'Frequent outstation business travel leads to missed drop schedules and clinic appointment cancellations'
      ]
    },
    conversionBarriers: [
      {
        id: 'b-103-1',
        category: 'Procedure Hesitation',
        description: 'Asymptomatic condition perception: Believes drops are adequate and hesitates on SLT laser procedure without acute physical pain.',
        supportingExcerpt: 'Pichle mahine travelling ki wajah se main raat wali eyedrop do hafte nahi daal paaya. Kya isse optic nerve damage badh gaya hai?',
        isExplicit: true
      },
      {
        id: 'b-103-2',
        category: 'Timing / Availability',
        description: 'Frequent business travel schedule causing missed medication doses and postponed appointments.',
        supportingExcerpt: 'Frequent outstation business travel leads to missed drop schedules and clinic appointment cancellations.',
        isExplicit: false
      }
    ],
    audioUrl: createSyntheticDemoAudioUrl(185, 'Glaucoma IOP Review'),
    transcript: [
      {
        id: 't-g1',
        speaker: 'Dr. Arvind Mehta (Ophthalmologist)',
        timestamp: '00:00',
        startSeconds: 0,
        text: 'Suresh ji, Goldman Applanation Tonometry se aapke right eye ka intraocular pressure (IOP) 24 mmHg aaya hai. Left eye 16 mmHg hai. 24 mmHg is significantly high.'
      },
      {
        id: 't-g2',
        speaker: 'Suresh Gupta (Patient)',
        timestamp: '00:32',
        startSeconds: 32,
        text: 'Doctor sahab, pichle mahine travelling ki wajah se main raat wali eyedrop do hafte nahi daal paaya. Kya isse optic nerve damage badh gaya hai?'
      },
      {
        id: 't-g3',
        speaker: 'Dr. Arvind Mehta (Ophthalmologist)',
        timestamp: '01:05',
        startSeconds: 65,
        text: 'Aapke Humphrey Visual Field analyzer report me superior arcuate scotoma halka deepen hua hai. Optic disc cup-to-disc ratio right eye me 0.75 hai. Glaucoma eyedrops me ek din ka bhi gap nahi hona chahiye.'
      },
      {
        id: 't-g4',
        speaker: 'Dr. Arvind Mehta (Ophthalmologist)',
        timestamp: '01:40',
        startSeconds: 100,
        text: 'Hum abhi treatment escalate kar rahe hain. Timolol 0.5% ke saath Bimatoprost combination drop add karenge, raat ko sone se pehle ek drop. Exactly 3 weeks baad pressure check ke liye aana hoga.'
      }
    ],
    summary: {
      executiveSummary: 'Glaucoma review for 58-year-old Suresh Gupta with Primary Open-Angle Glaucoma. Due to medication non-compliance during travel, right eye IOP spiked to 24 mmHg (target is <15 mmHg). Visual field testing revealed early superior arcuate defect progression. Therapy was escalated to a fixed combination prostaglandin analog plus beta-blocker, with mandatory review in 3 weeks.',
      keyTopics: [
        {
          title: 'Intraocular Pressure (IOP) Spike',
          summary: 'Right eye IOP measured 24 mmHg via Goldmann applanation; left eye stable at 16 mmHg.',
          bullets: [
            'Two-week missed eyedrop hiatus triggered pressure rise.',
            'Cup-to-disc ratio OD is 0.75 with inferior neuroretinal rim thinning.'
          ]
        },
        {
          title: 'Visual Field Defect Progression & Therapy Escalation',
          summary: 'Humphrey 24-2 visual field test demonstrated early superior arcuate defect.',
          bullets: [
            'Switched patient to combination Bimatoprost + Timolol drops nightly.',
            'Reinforced that eye drop compliance is essential to prevent irreversible peripheral vision loss.'
          ]
        }
      ],
      highlights: [
        'Detected IOP spike promptly before advanced nerve fiber loss.',
        'Escalated to dual-action hypotensive eye drops.'
      ],
      challenges: [
        'Patient compliance during outstation business travel.'
      ],
      outcomes: [
        'Prescribed Bimatoprost + Timolol combination drops.',
        'Follow-up IOP check scheduled in 3 weeks.'
      ],
      quickBulletOverview: [
        'Right eye IOP elevated at 24 mmHg.',
        'Start Bimatoprost + Timolol combo drop nightly at bedtime.',
        'Zero missed doses permitted.',
        'Mandatory IOP re-check in 3 weeks.'
      ]
    },
    tasks: [
      {
        id: 't-g-task-1',
        description: 'Instill Bimatoprost + Timolol combination eye drops in right eye (OD) nightly at bedtime without fail',
        owner: 'Patient (Suresh Gupta)',
        priority: 'High',
        dueDate: 'Nightly ongoing',
        isExplicitDeadline: true,
        status: 'In Progress',
        sourceRef: 'Dr. Mehta at 01:40',
        recordingId: 'rec-sample-ops-hindi-03',
        recordingTitle: 'Glaucoma IOP Progression & Visual Field Review',
        clientId: 'client-103'
      },
      {
        id: 't-g-task-2',
        description: 'Schedule follow-up Goldmann Applanation Tonometry IOP pressure check',
        owner: 'Clinic Receptionist',
        priority: 'High',
        dueDate: 'In 3 weeks',
        isExplicitDeadline: true,
        status: 'Pending',
        sourceRef: 'Dr. Mehta at 01:40',
        recordingId: 'rec-sample-ops-hindi-03',
        recordingTitle: 'Glaucoma IOP Progression & Visual Field Review',
        clientId: 'client-103'
      }
    ],
    plan: {
      objective: 'Lower right eye intraocular pressure below 15 mmHg to halt glaucomatous visual field loss.',
      phases: [
        {
          phaseName: 'Phase 1: Medical Pressure Reduction',
          durationOrPeriod: 'Next 3 Weeks',
          milestones: ['100% medication compliance', 'IOP reduction to < 16 mmHg'],
          keyDeliverables: ['Daily eye drop compliance log']
        },
        {
          phaseName: 'Phase 2: 3-Week Pressure Verification & Gonioscopy',
          durationOrPeriod: 'Week 3',
          milestones: ['Goldmann pressure check', 'Corneal pachymetry correction'],
          keyDeliverables: ['Confirmed pressure response']
        }
      ],
      recommendedNextSteps: [
        {
          step: 'Setup daily mobile phone alarm for 10:00 PM eye drop administration',
          owner: 'Suresh Gupta',
          suggestedDate: 'Tonight',
          isExplicitDate: false
        }
      ],
      dependenciesAndBlockers: ['Optic nerve preservation depends on continuous compliance.'],
      timelineDetails: [
        {
          item: 'Follow-Up IOP Check',
          date: 'In 3 weeks',
          dateType: 'stated',
          context: 'Directive issued by Dr. Mehta'
        }
      ],
      risksAndQuestions: ['Irreversible visual field loss if target pressure not achieved.']
    },
    decisions: [
      {
        id: 'dec-g1',
        decision: 'Escalate to fixed combination Bimatoprost + Timolol drops once nightly.',
        context: 'Monotherapy failed following compliance lapse, resulting in IOP spike to 24 mmHg.',
        status: 'confirmed',
        impact: 'Expected to drop IOP by 30-35% down to target 14-15 mmHg.'
      }
    ]
  }
];
