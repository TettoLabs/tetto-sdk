# Bounty Support Playbook

**For Tetto support team handling bounty issues**

---

## Common Scenarios

### Scenario 1: Builder Claimed But Never Delivered

**Indicators:**
- 30+ days since claim
- No submissions
- No response to Requester messages

**Action:**
1. Email Builder asking for status
2. Give 48 hours to respond
3. If no response, approve Requester refund
4. Ban Builder if pattern of abandonment

**Refund Process:**
```bash
npx tsx scripts/bounties/manual-refund.ts [bounty_id]
```

---

### Scenario 2: Requester Won't Approve Valid Work

**Indicators:**
- Builder submitted working agent
- Requester rejecting without valid reason
- Requirements clearly met

**Action:**
1. Review bounty requirements vs submission
2. Test agent ourselves
3. If valid, email Requester explaining
4. Give 48 hours to approve or provide valid feedback
5. If still refusing, release payment to Builder
6. Document decision

**Override Process:**
```bash
npx tsx scripts/bounties/admin-approve.ts [bounty_id] --reason "Support override"
```

---

### Scenario 3: Quality Dispute (Gray Area)

**Indicators:**
- Agent works but not as well as expected
- Requirements were vague
- Both parties have valid points

**Action:**
1. Review original requirements
2. Test agent functionality
3. Assess if reasonable person would approve
4. Options:
   - Full payment to Builder (if meets reqs)
   - Full refund to Requester (if clearly doesn't work)
   - **Split payment** (if partially complete): 50/50 or 70/30

**Split Payment Process:**
```bash
npx tsx scripts/bounties/split-payment.ts [bounty_id] --builder-percent 50
```

---

### Scenario 4: Malicious Code Submitted

**Indicators:**
- Security scan shows vulnerabilities
- Backdoors detected
- Plagiarized code

**Action:**
1. Immediately reject submission
2. Ban Builder permanently
3. Full refund to Requester
4. Report to platform security

---

## Escalation Matrix

**Tier 1 (Support handles):**
- Refunds < $100
- Clear-cut non-delivery
- Simple questions

**Tier 2 (Lead reviews):**
- Refunds $100-$500
- Quality disputes
- Repeated offenders

**Tier 3 (Founder/Legal):**
- Refunds > $500
- Legal threats
- Potential fraud
- Regulatory inquiries

---

## Response Time SLAs

- **Initial response:** 24 hours
- **Dispute resolution:** 5 business days
- **Refund processing:** 2 business days
- **Emergency (funds at risk):** 4 hours
