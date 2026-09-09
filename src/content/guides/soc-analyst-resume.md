---
title: "SOC Analyst Resume: Your Tier, Your Queue, and the Calls You Made"
description: "SOC managers read for the queue you carried and the judgment you showed in it: alerts per shift, escalation rate, the SIEM and EDR by name, and the detections you wrote. Here's how to write yours honestly, from tier 1 triage to incident response."
seoTitle: "SOC Analyst Resume: Tier, Alert Volume, SIEM & EDR"
seoDescription: "SOC analyst resume guide: write your tier, alerts per shift, MTTD/MTTR, SIEM and EDR by name, MITRE ATT&CK detections and certs as held, with a worked example."
segment: "job-seekers"
audience: "SOC tier 1, 2, and 3 analysts, incident responders, threat hunters, MSSP and MDR analysts, and help-desk or sysadmin people moving into detection and response"
keyword: "soc analyst resume"
giveaway:
  name: "Role Skills Checklist"
  file: "/templates/role-skills-checklist.docx"
cta:
  label: "Build your resume — $49"
  href: "/#pricing"
pubDate: 2026-09-09
order: 91
draft: false
faq:
  - q: "I was tier 1. Is that worth putting on a resume, or should I just write 'SOC analyst'?"
    a: "Write the tier. A SOC manager staffing a queue knows exactly what tier 1 means and wants to see you know it too: how many alerts you cleared per shift, what share you escalated, and how many of those held up at tier 2. Hiding the tier makes a manager guess, and the guess is rarely generous. 'Tier 1 SOC analyst' with real numbers under it reads stronger than a bare title with none."
  - q: "My SOC never showed me MTTD or MTTR. Can I still put response-time numbers on my resume?"
    a: "Only numbers you actually saw. If your SIEM or ticketing system reported mean time to detect or respond, use them and say which system they came from. If it did not, write what you can defend: cases owned per week, the containment actions you took, and the time-to-contain on a specific incident you handled. Never back into a team average you never measured."
  - q: "I worked at an MSSP covering dozens of clients. How do I write that without breaching client confidentiality?"
    a: "Write the scale, not the names. 'Monitored [N] client environments on a 24x7 MDR (managed detection and response) desk' is honest, checkable in an interview, and names nobody. Describe the industries if your contract allows it ('healthcare and regional banking clients'), the tools you worked in, and your case volume. Client names, hostnames, and incident details stay off the page."
  - q: "I moved from help desk to a SOC. Should my old help-desk job still be on the resume?"
    a: "Yes, and write it for what it taught you about normal. Ticket volume, the systems you supported, the account lockouts and malware cleanups you handled: those are the baseline knowledge a detection job runs on. Keep the real title, describe the work in plain terms, and let the SOC role above it show the move. Our help desk guide covers writing that job with honest queue numbers."
---

A SOC (security operations center) resume gets read for two things: the queue you carried and the calls you made in it. A manager staffing a 24x7 desk wants to know which tier you sat at, how many alerts you cleared per shift, how often you escalated, and whether the cases you sent up arrived usable. Generic language ("monitored security events and responded to incidents") answers none of that. Real numbers and named tools do.

This page is about detection-and-response work specifically. For the wider security field, from GRC (governance, risk, and compliance) to vulnerability management, and the full certification ladder, see our [cyber security resume guide](/guides/cyber-security-resume/). Here we stay inside the SOC: tiers, triage, incident response, threat hunting, and the MSSP (managed security service provider) desk.

## The shift line: your queue in one sentence

Under each SOC role, before the bullets, give one line another analyst would recognize on sight: the desk, the tier, the volume, and the tools.

**Before:** "Investigated security incidents and worked with the team to resolve them."

**After:** "Tier 2 SOC analyst on a 24x7 MDR desk covering [N] client environments; owned ~[N] escalated cases per week end to end in Splunk Enterprise Security and CrowdStrike Falcon, contained [N] confirmed host compromises, and authored [N] detections mapped to MITRE ATT&CK."

![Before and after example of an improved resume line - every line confirmed by the person](/img/guides/examples/soc-analyst-resume-example.png)

*Illustrative example. On your resume, every line comes from your real history — proposed as a question, added only when you confirm it.*

The second version answers what a SOC manager is actually asking: what desk, what tier, how much, in what, and did anything you touched get contained. Nothing in it is invented; it says plainly what the first line hid. Fill every bracket from your case system or shift reports, not from memory.

## Tier 1, tier 2, tier 3: write the tier you actually worked

SOC tiers are not the same job with different pay. Each one owns a different decision, and the resume should show the decision, not just the seat.

**Tier 1 is triage.** You own the first call on every alert: true positive, false positive, or needs a second look. Write the alert volume per shift, the share you escalated, and how many of those held up at tier 2. Name the ATT&CK technique you suspected on each handoff; a tier 2 analyst can start from that. "Escalated ~[N]% of alerts; [N]% held up at tier 2" says your judgment was worth trusting.

**Tier 2 is investigation and containment.** You own cases end to end: log correlation, EDR (endpoint detection and response) timeline review, host isolation, account disables, and the write-up. Write cases owned per week, the containment actions you personally executed, and the incident types: business email compromise, commodity malware, credential stuffing, ransomware precursors.

**Tier 3 is hunting and engineering.** You own what the queue does not catch yet: hypothesis-driven hunts across the SIEM (security information and event management platform), new detection logic, tuning the rules that flood tier 1, and the hard incidents. Write hunts run, detections authored, and false-positive reduction on rules you tuned.

If your shop did not use tiers, say so: "single-tier SOC of [N] analysts; each analyst owned alerts through containment." Threat hunters and incident responders write their real title and the same kind of evidence.

## The numbers a SOC manager can check

Every shift leaves a count behind it, so a bullet with no count reads as a shift you cannot describe. You need real numbers, with the system they came from.

- **Alert volume per shift.** The raw count from your SIEM or case platform; a range is fine if it swung ("~[N]-[N] alerts per 12-hour shift").
- **Escalation rate and true-positive ratio.** The share of alerts you escalated, and the share of those that held up. Together they show judgment.
- **MTTD and MTTR.** Mean time to detect (first malicious activity to alert) and mean time to respond. "Respond" means acknowledge at some SOCs and contain or resolve at others, so say which yours measured: "MTTR (acknowledge-to-contain) held under [N] minutes on the queue I owned." Only if a dashboard reported it.
- **Phishing analysis.** User-reported messages analyzed per week, attachments detonated in a sandbox, accounts reset, senders blocked.
- **Log sources onboarded.** The systems you brought into the SIEM and the parsing you wrote to make them searchable. This is engineering evidence.
- **Coverage and scale.** Nights, weekends, and holiday rotation; for MSSP or MDR (managed detection and response) desks, client environments monitored and endpoints under EDR. Scale, never client names.

If your team never showed you a metric, do not reconstruct it. Write what you can defend in an interview, and mark any estimate with a tilde.

## Your stack, named the way the SOC writes it

Screening filters and the analyst reading behind them match on product names, so write each platform exactly as its vendor does today. Several have been renamed, and the old name dates you.

**SIEM:** Splunk Enterprise Security, Microsoft Sentinel, Elastic Security, IBM QRadar SIEM, and Google Security Operations (formerly Chronicle; Google rebranded it in 2024). If you hunted in a query language, name it: SPL (Splunk's Search Processing Language) or KQL (Kusto Query Language, used in Sentinel and Microsoft Defender XDR).

**EDR:** CrowdStrike Falcon, SentinelOne Singularity, Microsoft Defender for Endpoint. Say what you did in it, not just that you had a console: timeline review, host isolation, live response, custom IOA (indicator of attack) or IOC (indicator of compromise) rules.

**SOAR (security orchestration, automation, and response):** Splunk SOAR (formerly Phantom), Palo Alto Networks Cortex XSOAR, Microsoft Sentinel playbooks (built on Azure Logic Apps), Tines. A playbook you built is worth a line if it changed the queue: "built a Sentinel playbook that auto-enriched phishing reports, removing ~[N] minutes of lookup per case." Name your case system too (ServiceNow, Jira, or the SOAR's own); the handoff lived there.

Name the product, not the category, and only the ones you worked in yourself; label home-lab work as a home lab. Our cyber security guide covers the rest of the tool-honesty rules.

## Detections, playbooks, and the incident lifecycle

Detection-and-response work leaves artifacts, and the artifacts are your best evidence.

**MITRE ATT&CK mapping.** ATT&CK is MITRE's public knowledge base of adversary tactics and techniques, and many SOCs tag alerts and detections against it. Write the techniques you actually worked, by name and ID when you can: phishing (T1566), valid accounts (T1078), PowerShell execution (T1059.001). A coverage line ("mapped the rule set to ATT&CK and closed [N] uncovered techniques with new detections") shows engineering judgment.

**Detections authored and tuned.** Count the rules you wrote and the noisy ones you fixed. "Tuned [N] high-volume rules, cutting tier 1 false positives on those rules by ~[N]%" is a line that carries weight at every tier, because rule tuning is work many SOCs are behind on. Playbooks and runbooks you wrote or revised count the same way; say which, and whether they ran by hand or in a SOAR.

**The incident lifecycle, cited correctly.** Many SOC playbooks still use the phase language from NIST SP 800-61 Rev 2: preparation; detection and analysis; containment, eradication, and recovery; post-incident activity. In April 2025 NIST replaced Rev 2 with SP 800-61 Rev 3, "Incident Response Recommendations and Considerations for Cybersecurity Risk Management: A CSF 2.0 Community Profile," which maps incident response to the six functions of the NIST Cybersecurity Framework (CSF) 2.0 instead of the four phases. If you name the standard, name the revision your program actually followed.

## Certifications: the detection-and-response set

The full security certification ladder is on our [cyber security resume guide](/guides/cyber-security-resume/). Here is the subset that speaks to SOC work, written as each body names it today. Give them their own labeled block: full name, issuer, date.

- **CompTIA CySA+** — CompTIA's Cybersecurity Analyst certification. The current exam is CS0-004 (launched June 2026); the older CS0-003 is still offered until December 2026, and a passed CySA+ stays valid for its three-year term either way. Its four domains are security operations, vulnerability management, incident response and management, and reporting and communication: the SOC job description.
- **GIAC GCIH and GCIA** — GIAC Certified Incident Handler and GIAC Certified Intrusion Analyst, from GIAC, the certification body associated with the SANS Institute. GCIH is the incident-response credential; GCIA is the traffic-and-log analysis one, and the two together describe a tier 2 desk.
- **Microsoft Certified: Security Operations Analyst Associate (exam SC-200)** — covers Sentinel, Defender XDR, and KQL hunting. Microsoft certifications of this type are valid for one year and renew through a free online assessment, so "current through [month/year]" is the honest form.
- **Splunk Core Certified User and Splunk Core Certified Power User** — Splunk's own credentials; Power User has no prerequisite exam, so write whichever one you actually hold.

**DoD 8140** is not a certification; it is the Department of Defense qualification program for its cyber workforce. DoD Manual 8140.03 replaced the older 8570.01-M in February 2023, with qualification deadlines phased in from February 2025 through February 2027 by workforce element, and it qualifies people by DCWF (DoD Cyber Workforce Framework) work role rather than the old IAT/IAM levels. For a defense contractor, write the qualifying credential you hold ("Security+ (CE), current") and the work role if you know it, not "8140 certified." If you hold a clearance, write it as held and no more; our [security clearance guide](/guides/how-to-list-security-clearance-on-resume/) covers the exact wording.

Security+, GSEC, ISC2 SSCP, and ISC2 CISSP are on the cyber security guide's ladder; list them the same way, full name, issuer, date. "In progress" is fine when specific: "CySA+ — exam scheduled [month/year]." A bare cert name you have not earned gets checked against the issuing body, and fails.

## Moving in from help desk or sysadmin work

Many analysts came to the SOC from a ticket queue or a server room, and that history is an asset when written as one: you have already seen thousands of ordinary logins, lockouts, and patch cycles, which is exactly the baseline a detection job runs on. Do not re-title the old job. Keep "help desk technician" or "systems administrator" and write the security work it contained in plain terms. Our [help desk resume guide](/guides/help-desk-resume/) and [systems administrator resume guide](/guides/systems-administrator-resume/) cover writing that job with honest numbers; this page covers what to write once you are on the desk.

## Format notes

**Length follows your history, not a page rule.** Two pages is normal once you have more than one substantive role to describe, and a help-desk-to-tier-2 progression earns the second page. One genuine exception: federal applications through USAJOBS cap at two pages as of the September 2025 OPM change. That is a hard requirement.

Otherwise: reverse chronological, single column, a shift line under every SOC role, certifications in their own labeled block, and tools written as plain text grouped by SIEM, EDR, and SOAR. Skip skill-rating bars and graphics; screening software cannot read them and a hiring manager does not trust them. And nothing from a client environment or an active incident goes on the page, ever.

## A bullet bank you can adapt — keep only what's true

- "Tier [1/2] SOC analyst on a 24x7 [in-house/MSSP/MDR] desk; triaged ~[N] alerts per shift in [Splunk Enterprise Security/Microsoft Sentinel/Elastic Security]"
- "Escalated ~[N]% of alerts; [N]% held up as true positives at tier 2, with the suspected ATT&CK technique named on each handoff"
- "Owned ~[N] cases per week end to end: log correlation, [CrowdStrike Falcon/SentinelOne/Defender for Endpoint] timeline review, host isolation, account disable, written summary"
- "Owned the user-reported phishing queue: ~[N] reports per week analyzed, [N] confirmed malicious, purge/block/reset actions taken in [tool]"
- "Authored [N] detections mapped to MITRE ATT&CK techniques [T-IDs], closing [N] previously uncovered techniques on the rule set"
- "Built [N] [Splunk SOAR/Cortex XSOAR/Sentinel] playbooks automating [enrichment/containment step]; monitored [N] client environments on a [24x7/rotating] MDR desk"

Each bullet is a frame, not a claim. If a line is not true of your queue, it does not go on your page; a case-system export will find the gap.

## What screening software looks for on a SOC analyst resume

Filters commonly read for: SOC analyst, security operations center, tier 1, tier 2, alert triage, incident response, threat hunting, detection engineering, SIEM, EDR, SOAR, MSSP, MDR, phishing analysis, MITRE ATT&CK, NIST SP 800-61, Splunk, Microsoft Sentinel, Elastic, QRadar, Google Security Operations, CrowdStrike Falcon, SentinelOne, Microsoft Defender for Endpoint, KQL, SPL, playbooks, containment, and the certification names themselves.

One honesty note on job codes: the Department of Labor has no separate code for SOC analysts. [O*NET profiles this work under Information Security Analysts (15-1212.00)](https://www.onetonline.org/link/summary/15-1212.00), the same code our cyber security guide uses, and its technology list names Splunk Enterprise and MITRE ATT&CK as in-demand tools. That shared code is why your tier, your queue numbers, and your named stack have to carry the message the code cannot.

The highest-risk lines are certifications, clearances, and any number you never saw on a dashboard. All three get checked.

The **Role Skills Checklist** below helps you inventory what your shifts and cases actually prove, which is usually more than the resume currently says. Our build does it with you: we work backwards from your real desk, queue, tools, and history, propose the lines that work like yours normally involves, each one offered as a question, and ask you to confirm every item before it appears. We never add a certification, a clearance, a platform, or a number you didn't tell us about.
